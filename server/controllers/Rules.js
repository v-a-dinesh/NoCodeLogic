import db from "../models/index.js";
import { createError } from "../error.js";
import { Op } from "sequelize";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { createRuleRequest } from "../utils/prompt.js";
import { Sequelize } from "sequelize";
import * as dotenv from "dotenv";
import xlsx from "xlsx";
import path from "path";
dotenv.config();

// Primary and fallback API keys from environment
const PRIMARY_API_KEY = process.env.GEMINI_API_KEY;
const FALLBACK_API_KEY = process.env.GEMINI_API_KEY_FALLBACK;

// Initialize GenAI instances for both keys
const primaryGenAI = new GoogleGenerativeAI(PRIMARY_API_KEY);
const fallbackGenAI = FALLBACK_API_KEY ? new GoogleGenerativeAI(FALLBACK_API_KEY) : null;

// Model configurations in order of preference
const MODEL_CONFIGS = [
  { genAI: primaryGenAI, model: "gemini-2.5-flash-lite", name: "Primary Key + Flash-Lite" },
  { genAI: primaryGenAI, model: "gemini-2.5-flash", name: "Primary Key + Flash" },
  { genAI: fallbackGenAI, model: "gemini-2.5-flash-lite", name: "Fallback Key + Flash-Lite" },
  { genAI: fallbackGenAI, model: "gemini-2.5-flash", name: "Fallback Key + Flash" },
];

// Helper function to call Gemini with fallback support
async function callGeminiWithFallback(prompt, generationConfig) {
  let lastError = null;
  
  for (const config of MODEL_CONFIGS) {
    if (!config.genAI) continue; // Skip if fallback key not configured
    
    try {
      console.log(`Trying: ${config.name}...`);
      const model = config.genAI.getGenerativeModel({ model: config.model });
      const result = await model.generateContent({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig,
      });
      
      if (result && result.response) {
        console.log(`Success with: ${config.name}`);
        return result;
      }
    } catch (error) {
      console.error(`Failed with ${config.name}:`, error.message);
      lastError = error;
      // Continue to next fallback
    }
  }
  
  throw lastError || new Error("All Gemini API configurations failed");
}

// Keep legacy reference for backward compatibility (uses primary key)
const genAI = primaryGenAI;

const sequelize = new Sequelize(process.env.DATABASE_URL, {
  dialect: "postgres",
});

const Rule = db.rule;
const User = db.user;
const Version = db.version;
const BankUser = db.bankUser;

export const createRule = async (req, res, next) => {
  const {
    title,
    description,
    tables,
    inputAttributes,
    outputAttributes,
    condition,
  } = req.body;
  const test = JSON.parse(req.body.condition);
  const userId = req.user.id;
  try {
    const user = await User.findOne({ where: { id: userId } });
    if (!user) {
      return next(createError(404, "User not found"));
    }
    const rule = await Rule.create({
      title,
      description,
      tables,
      inputAttributes,
      outputAttributes,
      condition,
    });
    await rule.setUser(user);
    const version = await Version.create({
      title: rule.title,
      description: rule.description,
      tables: rule.tables,
      inputAttributes: rule.inputAttributes,
      outputAttributes: rule.outputAttributes,
      condition: rule.condition,
      version: rule.version,
    });
    await version.setRule(rule);
    return res.status(201).json(rule);
  } catch (error) {
    return next(error);
  }
};

export const getRules = async (req, res, next) => {
  const userId = req.user.id;
  try {
    const user = await User.findOne({ where: { id: userId } });
    if (!user) {
      return next(createError(404, "User not found"));
    }
    const rules = await user.getRules();
    return res.status(200).json(rules);
  } catch (error) {
    return next(error);
  }
};

export const getRuleByIdAndVersion = async (req, res, next) => {
  const userId = req.user.id;
  const { id } = req.params;
  const version = req.body.version;
  try {
    const user = await User.findOne({ where: { id: userId } });
    if (!user) {
      return next(createError(404, "User not found"));
    }
    const rule = await Rule.findOne({ where: { id: id } });
    if (!rule) {
      return res.status(404).json({ error: "Rule not found" });
    }
    const userRules = await user.getRules();
    const ruleIds = userRules.map((rule) => rule.id);
    if (!ruleIds.includes(id)) {
      return next(createError(403, "You are not owner of this rule"));
    }
    const versions = await rule.getVersions();
    let versionValues = [];
    await versions
      .sort((a, b) => a.version - b.version)
      .map((version) => {
        versionValues.push(version.version);
      });
    if (!version) {
      return res.status(200).json({ rule: rule, versions: versionValues });
    } else {
      const ruleVersion = await Version.findOne({
        where: {
          ruleId: id,
          version: version,
        },
      });
      if (!ruleVersion) {
        return res.status(404).json({ error: "Rule not found" });
      }
      return res
        .status(200)
        .json({ rule: ruleVersion, versions: versionValues });
    }
  } catch (error) {
    return next(createError(error.status, error.message));
  }
};

export const searchRule = async (req, res) => {
  const userId = req.user.id;
  const query = req.query.title;
  try {
    const user = await User.findOne({ where: { id: userId } });
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const userRules = await user.getRules();

    const rules = await Rule.findAll({
      attributes: ["id", "title", "description"], // Select only the required attributes
      where: {
        id: {
          [Op.in]: userRules.map((rule) => rule.id),
        },
        title: {
          [Op.iLike]: `%${query}%`,
        },
      },
      limit: 40,
    });

    res.status(200).json(rules);
  } catch (err) {
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export const updateRule = async (req, res, next) => {
  const userId = req.user.id;
  const ruleId = req.params.id;
  const newRule = req.body;
  const version = req.body.version;
  try {
    const user = await User.findOne({ where: { id: userId } });
    if (!user) {
      return next(createError(404, "User not found"));
    }
    const rule = await Rule.findOne({ where: { id: ruleId } });
    if (!rule) {
      return next(createError(404, "No rule with that id"));
    }
    //check if user is owner of this rule
    const userRules = await user.getRules();
    const ruleIds = userRules.map((rule) => rule.id);
    if (!ruleIds.includes(ruleId)) {
      return next(createError(403, "You are not owner of this rule"));
    }
    if (version == rule.version) {
      await Rule.update(
        {
          title: newRule.title,
          description: newRule.description,
          tables: newRule.tables,
          inputAttributes: newRule.inputAttributes,
          outputAttributes: newRule.outputAttributes,
          condition: newRule.condition,
          version: newRule.version,
        },
        {
          where: {
            id: ruleId,
          },
        }
      );
      const updatedRule = await Rule.findOne({ where: { id: ruleId } });
      await Version.update(
        {
          title: newRule.title,
          description: newRule.description,
          tables: newRule.tables,
          inputAttributes: newRule.inputAttributes,
          outputAttributes: newRule.outputAttributes,
          condition: newRule.condition,
          version: newRule.version,
        },
        {
          where: {
            ruleId: ruleId,
            version: version,
          },
        }
      );

      const versions = await rule.getVersions();
      let versionValues = [];
      await versions.map((version) => {
        versionValues.push(version.version);
      });
      return res
        .status(200)
        .json({ rule: updatedRule, versions: versionValues });
    } else {
      const ruleVersion = await Version.findOne({
        where: {
          ruleId: ruleId,
          version: version,
        },
      });
      await Version.update(
        {
          title: newRule.title,
          description: newRule.description,
          tables: newRule.tables,
          inputAttributes: newRule.inputAttributes,
          outputAttributes: newRule.outputAttributes,
          condition: newRule.condition,
          version: newRule.version,
        },
        {
          where: {
            id: ruleVersion.id,
          },
        }
      );
      const updatedVersion = await Version.findOne({
        where: { id: ruleVersion.id },
      });
      const versions = await rule.getVersions();
      let versionValues = [];
      await versions.map((version) => {
        versionValues.push(version.version);
      });

      return res
        .status(200)
        .json({ rule: updatedVersion, versions: versionValues });
    }
  } catch (error) {
    return next(createError(error.status, error.message));
  }
};

export const updateRuleWithVersion = async (req, res, next) => {
  const userId = req.user.id;
  const ruleId = req.params.id;
  const newRule = req.body;
  try {
    const user = await User.findOne({ where: { id: userId } });
    if (!user) {
      return next(createError(404, "User not found"));
    }
    const rule = await Rule.findOne({ where: { id: ruleId } });
    if (!rule) {
      return next(createError(404, "No rule with that id"));
    }
    //check if user is owner of this rule
    const userRules = await user.getRules();
    const ruleIds = userRules.map((rule) => rule.id);
    if (!ruleIds.includes(ruleId)) {
      return next(createError(403, "You are not owner of this rule"));
    }
    await Rule.update(
      { ...newRule, version: (rule.version + 0.1).toFixed(1) },
      {
        where: {
          id: ruleId,
        },
      }
    );
    const updatedRule = await Rule.findOne({ where: { id: ruleId } });
    const version = await Version.create({
      title: updatedRule.title,
      description: updatedRule.description,
      tables: updatedRule.tables,
      inputAttributes: updatedRule.inputAttributes,
      outputAttributes: updatedRule.outputAttributes,
      condition: updatedRule.condition,
      version: updatedRule.version,
    });
    await version.setRule(updatedRule);
    const versions = await rule.getVersions();
    let versionValues = [];
    await versions
      .sort((a, b) => a.version - b.version)
      .map((version) => {
        versionValues.push(version.version);
      });
    return res.status(200).json({ rule: updatedRule, versions: versionValues });
  } catch (error) {
    return next(createError(error.status, error.message));
  }
};

export const deleteRule = async (req, res, next) => {
  const userId = req.user.id;
  const ruleId = req.params.id;
  const version = req.params.versionId;
  try {
    const user = await User.findOne({ where: { id: userId } });
    if (!user) {
      return next(createError(404, "User not found"));
    }
    const rule = await Rule.findOne({ where: { id: ruleId } });
    if (!rule) {
      return next(createError(404, "No rule with that id"));
    }
    //check if user is owner of this rule
    const userRules = await user.getRules();
    const ruleIds = userRules.map((rule) => rule.id);
    if (!ruleIds.includes(ruleId)) {
      return next(createError(403, "You are not owner of this rule"));
    }
    await Version.destroy({
      where: {
        ruleId: ruleId,
        version: version,
      },
    });
    if (version == rule.version) {
      const ruleVersions = await rule.getVersions();
      if (ruleVersions.length == 0) {
        await Rule.destroy({
          where: {
            id: ruleId,
          },
        });
        return res.status(204).json({ message: "Rule deleted succesfully" });
      } else {
        let versionValues = [];
        await ruleVersions
          .sort((a, b) => a.version - b.version)
          .map((version) => {
            versionValues.push(version.version);
          });

        const latestVersion = ruleVersions[ruleVersions.length - 1];

        await Rule.update(
          {
            title: latestVersion.title,
            description: latestVersion.description,
            tables: latestVersion.tables,
            inputAttributes: latestVersion.inputAttributes,
            outputAttributes: latestVersion.outputAttributes,
            condition: latestVersion.condition,
            version: latestVersion.version,
          },
          {
            where: {
              id: ruleId,
            },
          }
        );
        const newLatestRule = await Rule.findOne({
          where: {
            id: ruleId,
          },
        });
        return res
          .status(200)
          .json({ rule: newLatestRule, versions: versionValues });
      }
    } else {
      const ruleVersions = await rule.getVersions();
      let versionValues = [];
      await ruleVersions
        .sort((a, b) => a.version - b.version)
        .map((version) => {
          versionValues.push(version.version);
        });
      return res.status(200).json({ rule: rule, versions: versionValues });
    }
  } catch (error) {
    return next(createError(error.status, error.message));
  }
};

export const testingExcel = async (req, res, next) => {
  const storagePath = "FILES_STORAGE/";
  const userId = req.user.id;
  const { id } = req.params;
  let data = [];
  
  try {
    const user = await User.findOne({ where: { id: userId } });
    if (!user) {
      return next(createError(404, "User not found"));
    }
    
    const rule = await Rule.findOne({ where: { id: id } });
    if (!rule) {
      return next(createError(404, "No rule with that id"));
    }
    
    //check if user is owner of this rule
    const userRules = await user.getRules();
    const ruleIds = userRules.map((rule) => rule.id);
    if (!ruleIds.includes(id)) {
      return next(createError(403, "You are not owner of this rule"));
    }
    
    const file = req.file;
    if (!file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    const filePath = path.join(storagePath, file.filename);
    
    // Read Excel file with error handling
    let workbook;
    try {
      workbook = xlsx.readFile(filePath);
    } catch (error) {
      console.error("Error reading Excel file:", error);
      return next(createError(400, "Invalid Excel file format"));
    }
    
    const sheet_name_list = workbook.SheetNames;
    if (sheet_name_list.length === 0) {
      return next(createError(400, "Excel file contains no sheets"));
    }

    // Process each sheet
    for (const sheetName of sheet_name_list) { 
      try {
        const worksheet = workbook.Sheets[sheetName];
        if (!worksheet) {
          console.error(`Sheet ${sheetName} not found in workbook`);
          continue;
        }
        
        // Parse the worksheet
        let headers = {};
        let sheetData = [];
        
        for (let z in worksheet) {
          if (z[0] === "!") continue;
          
          // Parse out the column, row, and value
          const col = z.substring(0, 1);
          const row = parseInt(z.substring(1));
          const value = worksheet[z].v;
          
          // Store header names
          if (row == 1) {
            headers[col] = value;
            continue;
          }
          
          // Create row data objects
          if (!sheetData[row]) sheetData[row] = {};
          sheetData[row][headers[col]] = value;
        }
        
        // Remove empty rows
        sheetData = sheetData.filter(Boolean);
        
        // Skip processing if no data
        if (sheetData.length === 0) {
          console.warn(`No data found in sheet ${sheetName}`);
          continue;
        }
        
        // Add to main data array
        data = [...data, ...sheetData];
      } catch (error) {
        console.error(`Error processing sheet ${sheetName}:`, error);
      }
    }

    // Check if we have any data to process
    if (data.length === 0) {
      return next(createError(400, "No valid data found in Excel file"));
    }

    // Parse rule condition with error handling
    let conditionObj;
    try {
      conditionObj = JSON.parse(rule.condition);
      
      // Validate condition structure
      if (!conditionObj || !conditionObj.nodes || !conditionObj.edges || 
          !Array.isArray(conditionObj.nodes) || !Array.isArray(conditionObj.edges)) {
        throw new Error("Invalid condition structure");
      }
    } catch (error) {
      console.error("Error parsing rule condition:", error);
      return next(createError(400, "Rule has invalid condition format"));
    }

    // Process data with rule
    for (let index = 0; index < data.length; index++) {
      const inputData = data[index];
      
      try {
        // Find attribute node
        const attributeNode = conditionObj.nodes.find(
          (node) => node && node.type === "attributeNode"
        );
        
        if (!attributeNode) {
          console.error("Attribute node not found in rule");
          continue;
        }

        // Find first conditional node
        const firstConditionalNodeEdge = conditionObj.edges.find(
          (edge) => edge && edge.source === "1"
        );
        
        if (!firstConditionalNodeEdge || !firstConditionalNodeEdge.target) {
          console.error("First conditional node edge not found");
          continue;
        }

        const firstConditionalNodeId = firstConditionalNodeEdge.target;
        const firstConditionalNode = conditionObj.nodes.find(
          (node) => node && node.id === firstConditionalNodeId
        );
        
        if (!firstConditionalNode) {
          console.error("First conditional node not found");
          continue;
        }

        // Deep clone the condition for this iteration to avoid cross-contamination
        const clonedCondition = JSON.parse(JSON.stringify(conditionObj));
        
        // Set attribute node color
        clonedCondition.nodes.forEach((node, idx) => {
          if (node && node.type === "attributeNode") {
            clonedCondition.nodes[idx] = {
              ...node,
              data: {
                ...(node.data || {}),
                computed: "yes",
                color: "#02ab40",
                result: true,
              },
            };
          }
        });

        // Set edge animation for first connection
        clonedCondition.edges.forEach((edge, idx) => {
          if (edge && edge.source === attributeNode.id && edge.target === firstConditionalNode.id) {
            clonedCondition.edges[idx] = {
              ...edge,
              animated: true,
              markerEnd: {
                type: "arrowclosed",
                width: 12,
                height: 12,
                color: "#02ab40",
              },
               // Continuing from where we left off in testingExcel function
              style: {
                strokeWidth: 5,
                stroke: "#02ab40",
              },
            };
          }
        });

        // Process the rule for this data row
        let traversalNodes = [];
        let testedRule = await evaluateNodes(
          firstConditionalNode,
          clonedCondition,
          rule,
          traversalNodes,
          inputData,
          { condition: JSON.stringify(clonedCondition) }
        );
        
        // Update output fields in data if available
        if (testedRule && testedRule.output && Array.isArray(testedRule.output)) {
          testedRule.output.forEach(output => {
            if (output && output.field) {
              data[index][output.field] = output.value;
            }
          });
        }
        
        // Update rule condition for the last processed row
        if (testedRule && testedRule.rule && testedRule.rule.condition) {
          conditionObj = JSON.parse(testedRule.rule.condition);
        }
      } catch (error) {
        console.error(`Error processing row ${index}:`, error);
      }
    }

    // Mark rule as tested
    await Rule.update(
      { condition: JSON.stringify(conditionObj), tested: true },
      { where: { id: id } }
    );

    // Return processed data
    res.status(200).json({
      fields: data.length > 0 ? Object.keys(data[0]) : [],
      data: data,
    });
  } catch (error) {
    console.error("Error in testingExcel:", error);
    return next(createError(error.status || 500, error.message || "Internal Server Error"));
  }
};

export const testWithDb = async (req, res, next) => {
  const userId = req.user.id;
  const id = req.params.id;
  const tableName = req.body.name;
  try {
    const user = await User.findOne({ where: { id: userId } });
    if (!user) {
      return next(createError(404, "User not found"));
    }
    const rule = await Rule.findOne({ where: { id: id } });
    if (!rule) {
      return next(createError(404, "No rule with that id"));
    }
    //check if user is owner of this rule
    const userRules = await user.getRules();
    const ruleIds = userRules.map((rule) => rule.id);
    if (!ruleIds.includes(id)) {
      return next(createError(403, "You are not owner of this rule"));
    }
    const sql = `SELECT * FROM ${tableName}`;
    const [rows] = await sequelize.query(sql, { type: sequelize.QueryTypes.SELECT });
    return res.json(rows);
  } catch (error) {
    return next(createError(error.status, error.message));
  }
}

export const createRuleWithText = async (req, res, next) => {
  const userId = req.user.id;
  const ruleId = req.params.id;
  const { version: versionParam, conditions: textConditions } = req.body;
  
  try {
    // Validation checks
    const user = await User.findOne({ where: { id: userId } });
    if (!user) {
      return next(createError(404, "User not found"));
    }
    
    const rule = await Rule.findOne({ where: { id: ruleId } });
    if (!rule) {
      return next(createError(404, "No rule with that id"));
    }
    
    // Check if user is owner of this rule
    const userRules = await user.getRules({attributes: ['id']});
    const ruleIds = userRules.map((r) => String(r.id));
    if (!ruleIds.includes(String(ruleId))) {
      return next(createError(403, "You are not owner of this rule"));
    }

    if (!versionParam) {
      return next(createError(400, "Version parameter is required."));
    }
    if (!textConditions) {
      return next(createError(400, "Input 'conditions' text is required."));
    }

    // Get the correct rule data for the prompt
    let ruleDataForPrompt;
    if (String(rule.version) === String(versionParam)) {
      ruleDataForPrompt = rule;
    } else {
      const specificVersion = await Version.findOne({ 
        where: { ruleId: ruleId, version: versionParam }
      });
      if (!specificVersion) {
        return next(createError(404, `Version ${versionParam} not found for this rule.`));
      }
      ruleDataForPrompt = specificVersion;
    }

    // Create the prompt using your existing function
    const prompt = createRuleRequest(textConditions, JSON.stringify(ruleDataForPrompt));

    // Make Gemini API call with fallback support
    const geminiResult = await callGeminiWithFallback(prompt, {
      temperature: 0.1,
      maxOutputTokens: 8192,
    });
    
    // Check for successful response
    if (!geminiResult || !geminiResult.response) {
      throw new Error("Failed to get response from Gemini API");
    }
    
    const responseText = geminiResult.response.text();
    console.log("Raw Gemini response:", responseText.substring(0, 200) + "..."); // Log a preview
    
    // Parse the response text to get the JSON
    let newConditionObject;
    try {
      // Clean up the response to extract just the JSON part
      let jsonText = responseText.trim();
      
      // Handle if response contains markdown code blocks
      if (jsonText.includes("```json")) {
        jsonText = jsonText.split("```json")[1].split("```")[0].trim();
      } else if (jsonText.includes("```")) {
        jsonText = jsonText.split("```")[1].split("```")[0].trim();
      }
      
      // Parse the JSON
      const parsedResponse = JSON.parse(jsonText);
      
      // Extract the condition object
      if (parsedResponse && parsedResponse.condition) {
        newConditionObject = parsedResponse.condition;
      } else {
        // If the entire response is the condition
        newConditionObject = parsedResponse;
      }
      
      // Validate that it has the required structure
      if (!newConditionObject.nodes || !Array.isArray(newConditionObject.nodes) || 
          !newConditionObject.edges || !Array.isArray(newConditionObject.edges)) {
        throw new Error("Response does not contain valid nodes and edges arrays");
      }
      
    } catch (e) {
      console.error("Error parsing Gemini response:", e, "Raw response:", responseText);
      return next(createError(400, `Failed to parse AI response: ${e.message}`));
    }

    // Update database with new condition
    const newConditionString = JSON.stringify(newConditionObject);
    
    // Update the main rule if necessary
    if (String(rule.version) === String(versionParam)) {
      await Rule.update(
        { condition: newConditionString },
        { where: { id: ruleId } }
      );
    }

    // Always update the version
    await Version.update(
      { condition: newConditionString },
      { where: { ruleId: ruleId, version: versionParam } }
    );

    // Get the updated rule/version for response
    let updatedRuleForResponse;
    if (String(rule.version) === String(versionParam)) {
      updatedRuleForResponse = await Rule.findOne({ where: { id: ruleId } });
    } else {
      updatedRuleForResponse = await Version.findOne({ 
        where: { ruleId: ruleId, version: versionParam } 
      });
    }

    // Get all versions for the response
    const allVersions = await Version.findAll({
      where: { ruleId: ruleId },
      order: [['version', 'ASC']]
    });
    const versionValues = allVersions.map(v => v.version);

    return res.status(200).json({ 
      rule: updatedRuleForResponse, 
      versions: versionValues 
    });

  } catch (error) {
    console.error("Error in createRuleWithText:", error);
    
    // Handle different types of errors with appropriate status codes
    if (error.name === 'GoogleGenerativeAIError') {
      return next(createError(502, `AI model error: ${error.message}`));
    }
    
    return next(createError(error.status || 500, error.message || "Internal Server Error"));
  }
};

export const testing = async (req, res, next) => {
  const inputAttributes = req.body;
  const { id, version } = req.params;
  const userId = req.user.id;

  try {
    const user = await User.findOne({ where: { id: userId } });
    if (!user) {
      return next(createError(404, "User not found"));
    }

    let rule = await Rule.findOne({ where: { id: id } });
    if (!rule) {
      return next(createError(404, "No rule with that id"));
    }

    const userRules = await user.getRules();
    const ruleIds = userRules.map((r) => r.id);
    if (!ruleIds.includes(id)) {
      return next(createError(403, "You are not owner of this rule"));
    }

    const testRule = await Version.findOne({
      where: {
        ruleId: id,
        version: version,
      },
    });

    if (!testRule) {
      return next(createError(404, "Version not found"));
    }

    const versions = await rule.getVersions();
    let versionValues = [];

    versions
      .sort((a, b) => a.version - b.version)
      .forEach((v) => {
        versionValues.push(v.version);
      });

    // Parse the condition with error handling
    let condition;
    try {
      condition = JSON.parse(testRule.condition);
      
      // Validate the condition structure
      if (!condition || !condition.nodes || !condition.edges || 
          !Array.isArray(condition.nodes) || !Array.isArray(condition.edges)) {
        return next(createError(400, "Rule has invalid condition structure"));
      }
    } catch (e) {
      return next(createError(400, "Rule has invalid condition format"));
    }

    let testedRule = { output: null };
    
    // Find attribute node with defensive coding
    const attributeNode = condition.nodes.find(node => node && node.type === "attributeNode");
    if (!attributeNode) {
      return next(createError(400, "Rule is missing attribute node"));
    }

    // Find first conditional node edge with defensive coding
    const firstConditionalNodeEdge = condition.edges.find(edge => edge && edge.source === "1");
    if (!firstConditionalNodeEdge) {
      return next(createError(400, "Rule is missing connection from attribute node"));
    }

    const firstConditionalNodeId = firstConditionalNodeEdge.target;
    if (!firstConditionalNodeId) {
      return next(createError(400, "Rule has invalid connection structure"));
    }

    // Find first conditional node
    const firstConditionalNode = condition.nodes.find(node => node && node.id === firstConditionalNodeId);
    if (!firstConditionalNode) {
      return next(createError(400, "Rule is missing conditional node"));
    }

    // Update nodes with defensive coding
    condition.nodes = condition.nodes.map(node => {
      if (node && node.type === "attributeNode") {
        return {
          ...node,
          data: {
            ...(node.data || {}),
            computed: "yes",
            color: "#02ab40",
            result: true,
          },
        };
      }
      return node;
    });

    // Update edges with defensive coding
    condition.edges = condition.edges.map(edge => {
      if (edge && edge.source === attributeNode.id && edge.target === firstConditionalNode.id) {
        return {
          ...edge,
          animated: true,
          markerEnd: {
            type: "arrowclosed",
            width: 12,
            height: 12,
            color: "#02ab40",
          },
          style: {
            strokeWidth: 5,
            stroke: "#02ab40",
          },
        };
      }
      return edge;
    });

    let traversalNodes = [];
    
    // Make sure first conditional node has required data
    if (!firstConditionalNode.data || !firstConditionalNode.data.conditions || 
        !firstConditionalNode.data.rule) {
      return next(createError(400, "Conditional node missing required data"));
    }
    
    // Call evaluateNodes with the validated data
    testedRule = await evaluateNodes(
      firstConditionalNode,
      condition,
      rule,
      traversalNodes,
      inputAttributes,
      { condition: JSON.stringify(condition) }
    );

    // Defensive coding for rule.condition access
    if (testedRule && testedRule.rule && testedRule.rule.condition) {
      rule.condition = testedRule.rule.condition;
    }

    await Rule.update(
      { ...rule, tested: true },
      {
        where: {
          id: id,
        },
      }
    );

    return res.json({
      rule: rule,
      versions: versionValues,
      output: testedRule?.output ? testedRule.output : null,
    });
  } catch (error) {
    console.error("Error in testing:", error);
    return next(createError(error.status || 500, error.message || "Internal Server Error"));
  }
};

// Utility functions
const specialFunctions = ["date_diff", "time_diff"];
const specialArrtibutes = ["current_date", "current_time"];

const setEdgeColor = (condition, node, traversalNodes, color, result) => {
  if (!condition || !condition.edges || !Array.isArray(condition.edges)) {
    console.error("Invalid condition or edges in setEdgeColor");
    return condition;
  }

  if (!node || !node.id) {
    console.error("Invalid node in setEdgeColor");
    return condition;
  }

  const targetEdges = condition.edges.filter(
    (edge) =>
      edge && edge.source === node.id &&
      edge.sourceHandle &&
      edge.sourceHandle === result
  );

  targetEdges.forEach((edge, index) => {
    if (!edge || !edge.target) {
      console.error("Invalid edge in targetEdges:", edge);
      return;
    }

    const targetNode = condition.nodes.find((n) => n && n.id === edge.target);
    if (targetNode) {
      traversalNodes.push(targetNode);
    }

    condition.edges = condition.edges.map((e) =>
      e && e.id === targetEdges[index].id
        ? {
          ...e,
          animated: true,
          markerEnd: {
            type: "arrowclosed",
            width: 12,
            height: 12,
            color: color,
          },
          style: {
            strokeWidth: 5,
            stroke: color,
          },
        }
        : e
    );
  });

  return condition;
};

const setNodeColor = (
  condition,
  node,
  traversalNodes,
  color,
  computed,
  result
) => {
  if (!condition || !condition.nodes || !Array.isArray(condition.nodes)) {
    console.error("Invalid condition or nodes in setNodeColor");
    return condition;
  }

  if (!node || !node.id) {
    console.error("Invalid node in setNodeColor");
    return condition;
  }

  const targetNode = condition.nodes.find((n) => n && n.id === node.id);
  if (!targetNode) {
    console.error("Target node not found in condition.nodes");
    return condition;
  }

  // Make sure traversalNodes is an array
  if (!Array.isArray(traversalNodes)) {
    console.error("traversalNodes is not an array in setNodeColor");
    traversalNodes = [];
  }

  traversalNodes.forEach((n) => {
    if (n && n.id === targetNode.id) {
      if (!n.data) n.data = {};
      n.data.computed = computed;
      n.data.color = color;
      n.data.result = result;
    }
  });

  condition.nodes = condition.nodes.map((n) =>
    n && n.id === targetNode.id
      ? {
        ...n,
        data: {
          ...(n.data || {}),
          computed: computed,
          color: color,
          result: result,
        },
      }
      : n
  );

  return condition;
};

const evaluateNodes = async (
  node,
  condition,
  rule,
  traversalNodes,
  inputAttributes,
  testedRule
) => {
  // Validate inputs
  if (!node || !node.data || !node.data.conditions || !node.data.rule) {
    console.error("Invalid node structure:", node);
    return { rule: testedRule, output: [] };
  }

  if (!condition || !condition.edges || !condition.nodes) {
    console.error("Invalid condition structure:", condition);
    return { rule: testedRule, output: [] };
  }

  // Evaluate conditions with proper error handling
  let result;
  try {
    result = evaluateConditions(
      node.data.conditions,
      node.data.rule,
      inputAttributes
    );
  } catch (error) {
    console.error("Error evaluating conditions:", error);
    result = [false, []];
  }

  // Update condition based on result
  if (result[0]) {
    try {
      let updatedCondition = setEdgeColor(
        condition,
        node,
        traversalNodes,
        "#02ab40",
        "yes"
      );
      updatedCondition = setNodeColor(
        updatedCondition,
        node,
        traversalNodes,
        "#02ab40",
        "yes",
        result[1]
      );
      condition = updatedCondition;
      testedRule.condition = JSON.stringify(updatedCondition);
    } catch (error) {
      console.error("Error setting colors for true condition:", error);
    }
  } else {
    try {
      let updatedCondition = setEdgeColor(
        condition,
        node,
        traversalNodes,
        "#02ab40",
        "no"
      );
      updatedCondition = setNodeColor(
        updatedCondition,
        node,
        traversalNodes,
        "#02ab40",
        "no",
        result[1]
      );
      condition = updatedCondition;
      testedRule.condition = JSON.stringify(updatedCondition);
    } catch (error) {
      console.error("Error setting colors for false condition:", error);
    }
  }

  let nextNode;

  // Process traversal nodes with defensive coding
  if (traversalNodes.length === 1) {
    if (traversalNodes[0] && traversalNodes[0].type === "outputNode") {
      try {
        let updatedCondition = setNodeColor(
          condition,
          traversalNodes[0],
          traversalNodes,
          "#02ab40",
          "yes",
          [true]
        );
        condition = updatedCondition;
        testedRule.condition = JSON.stringify(updatedCondition);
        return { 
          rule: testedRule, 
          output: traversalNodes[0].data && traversalNodes[0].data.outputFields ? 
                  traversalNodes[0].data.outputFields : [] 
        };
      } catch (error) {
        console.error("Error processing output node:", error);
        return { rule: testedRule, output: [] };
      }
    }
    nextNode = traversalNodes[0];
    traversalNodes = [];
  } else if (traversalNodes.length > 1) {
    let nestedResult;
    for (let i = 0; i < traversalNodes.length; i++) {
      try {
        if (!traversalNodes[i] || !traversalNodes[i].data || 
            !traversalNodes[i].data.conditions || !traversalNodes[i].data.rule) {
          console.error("Invalid traversal node:", traversalNodes[i]);
          continue;
        }

        nestedResult = evaluateConditions(
          traversalNodes[i].data.conditions,
          traversalNodes[i].data.rule,
          inputAttributes
        );
        
        if (nestedResult[0] === true) {
          nextNode = traversalNodes[i];
        } else {
          let updatedCondition = setNodeColor(
            condition,
            traversalNodes[i],
            traversalNodes,
            "#FF0072",
            "null",
            nestedResult[1]
          );
          condition = updatedCondition;
          
          // Set edge color to red with defensive coding
          const targetEdges = condition.edges.filter(
            (edge) => edge && edge.target === traversalNodes[i].id
          );

          targetEdges.forEach((edge, index) => {
            if (index < condition.edges.length) {
              condition.edges = condition.edges.map((e) =>
                e && e.id === targetEdges[index].id
                  ? {
                    ...e,
                    animated: true,
                    markerEnd: {
                      type: "arrowclosed",
                      width: 12,
                      height: 12,
                      color: "#FF0072",
                    },
                    style: {
                      strokeWidth: 5,
                      stroke: "#FF0072",
                    },
                  }
                  : e
              );
            }
          });
          
          testedRule.condition = JSON.stringify(condition);
        }
      } catch (error) {
        console.error("Error processing traversal node:", error);
      }
    }

    traversalNodes = [];
  }

  if (!nextNode) {
    return { rule: testedRule, output: [] };
  }

  if (nextNode.type === "outputNode") {
    try {
      let updatedCondition = setNodeColor(
        condition,
        nextNode,
        [nextNode], // Use nextNode directly instead of traversalNodes which is now empty
        "#02ab40",
        "yes",
        [true]
      );
      condition = updatedCondition;
      testedRule.condition = JSON.stringify(updatedCondition);
      return { 
        rule: testedRule, 
        output: nextNode.data && nextNode.data.outputFields ? nextNode.data.outputFields : [] 
      };
    } catch (error) {
      console.error("Error processing output node:", error);
      return { rule: testedRule, output: [] };
    }
  } else {
    return evaluateNodes(
      nextNode,
      condition,
      rule,
      traversalNodes,
      inputAttributes,
      testedRule
    );
  }
};

function evaluateConditions(conditions, rule, inputAttributes) {
  if (!conditions || !Array.isArray(conditions)) {
    console.error("Invalid conditions in evaluateConditions:", conditions);
    return [false, []];
  }

  let result = [];
  const eachConditionResult = [];
  let logicalOperator = null;

  for (const condition of conditions) {
    try {
      // Skip invalid conditions
      if (!condition || !condition.expression) {
        console.error("Invalid condition entry:", condition);
        eachConditionResult.push(false);
        continue;
      }

      const conditionResult = evaluateCondition(condition, inputAttributes);
      eachConditionResult.push(conditionResult);

      if (logicalOperator) {
        // If a logical operator is present, combine the previous result with the current result
        if (result.length > 0) {
          result[result.length - 1] = performLogicalOperation(
            result[result.length - 1],
            logicalOperator,
            conditionResult
          );
        }
        logicalOperator = null;
      } else {
        // If no logical operator, simply push the current result
        result.push(conditionResult);
      }

      if (condition.boolean != null && condition.boolean !== undefined) {
        // If a logical operator is found, store it for the next iteration
        logicalOperator = condition.boolean;
      }
    } catch (error) {
      console.error("Error evaluating condition:", error, condition);
      eachConditionResult.push(false);
      result.push(false);
    }
  }

  // Handle rule types with defensive coding
  if (rule === "Any") {
    return [result.includes(true), eachConditionResult];
  } else if (rule === "All") {
    return [result.every(Boolean), eachConditionResult];
  }

  // Default case
  return [result.length > 0 ? result[0] : false, eachConditionResult];
}

function evaluateCondition(condition, inputData) {
  if (!condition || !condition.expression) {
    console.error("Invalid condition in evaluateCondition:", condition);
    return false;
  }

  try {
    const { expression, boolean } = condition;
    // Evaluate the expression
    let result = [];
    result.push(evaluateExpression(expression, inputData));
    return result[result.length - 1];
  } catch (error) {
    console.error("Error in evaluateCondition:", error);
    return false;
  }
}

function evaluateExpression(expression, inputData) {
  if (!expression || !expression.lhs || !expression.rhs || !expression.comparator) {
    console.error("Invalid expression in evaluateExpression:", expression);
    return false;
  }

  try {
    const { lhs, comparator, rhs } = expression;

    const evaluateSide = (side, inputData) => {
      if (!side || !Array.isArray(side)) {
        console.error("Invalid side in evaluateSide:", side);
        return 0;
      }

      const sideResults = []; // Array to store results of each operand
      
      const getComparisonValue = (attribute, inputData) => {
        if (attribute === null || attribute === undefined) {
          return "";
        }
        
        const attributeValue =
          inputData && inputData[attribute] !== undefined
            ? String(inputData[attribute]).toLowerCase()
            : String(attribute).toLowerCase();

        return attributeValue;
      };
      
      side.forEach((operand) => {
        if (!operand) {
          console.error("Invalid operand in evaluateSide:", operand);
          sideResults.push(0);
          return;
        }

        let sideValue = 0;

        if (operand.op1 === null) {
          // Use the result of the previous evaluation
          if (sideResults.length > 0) {
            sideValue = sideResults[sideResults.length - 1];
          } else {
            // Handle if no previous result is available
            sideValue = 0;
          }
        } else if (typeof operand.op1 === 'string' && checkSpecialFunction(operand.op1.split(",")[0])) {
          sideValue = evaluateSpecialFunction(operand.op1, inputData);
        } else {
          sideValue = getComparisonValue(operand.op1, inputData);
        }

        switch (operand.operator) {
          case "/":
            sideValue /= parseFloat(operand.op2) || 1; // Avoid division by zero
            break;
          case "*":
            sideValue *= parseFloat(operand.op2) || 0;
            break;
          case "+":
            sideValue = parseFloat(sideValue) + (parseFloat(operand.op2) || 0);
            break;
          case "-":
            sideValue -= parseFloat(operand.op2) || 0;
            break;
          default:
            if (comparator === "==" || comparator === "!=") {
              // Keep as string for equality comparison
              sideValue = sideValue;
            } else {
              // Convert to number for numeric comparison
              sideValue = parseFloat(sideValue) || 0;
            }
            break;
        }

        // Store the result of the current operand in the array
        sideResults.push(sideValue);
      });

      // Return the final result of the last operand
      return sideResults.length > 0 ? sideResults[sideResults.length - 1] : 0;
    };

    const leftSideValue = evaluateSide(lhs, inputData);
    const rightSideValue = evaluateSide(rhs, inputData);

    switch (comparator) {
      case ">":
        return leftSideValue > rightSideValue;
      case "<":
        return leftSideValue < rightSideValue;
      case "==":
        return String(leftSideValue) === String(rightSideValue);
      case "!=":
        return String(leftSideValue) !== String(rightSideValue);
      case ">=":
        return leftSideValue >= rightSideValue;
      case "<=":
        return leftSideValue <= rightSideValue;
      default:
        console.error("Unknown comparator:", comparator);
        return false;
    }
  } catch (error) {
    console.error("Error in evaluateExpression:", error);
    return false;
  }
}

function checkSpecialFunction(func) {
  if (!func) return false;
  return specialFunctions.includes(func);
}

function evaluateSpecialFunction(inputAttribute, inputData) {
  if (!inputAttribute) {
    console.error("Invalid input attribute for special function");
    return 0;
  }

  try {
    const parts = inputAttribute.split(",");
    if (parts.length < 3) {
      console.error("Insufficient parameters for special function:", inputAttribute);
      return 0;
    }

    const [specialFunction, attribute1, attribute2, unit] = parts;

    const getDateAttributeValue = (attribute) => {
      if (!attribute) return new Date();
      return attribute.toLowerCase() === "current_date"
        ? new Date()
        : new Date(inputData[attribute] || 0);
    };

    const getDateTimeAttributeValue = (attribute) => {
      if (!attribute) return new Date();
      return attribute.toLowerCase() === "current_time"
        ? new Date()
        : new Date(inputData[attribute] || 0);
    };

    const date1 = getDateAttributeValue(attribute1);
    const date2 = getDateAttributeValue(attribute2);

    const time1 = getDateTimeAttributeValue(attribute1);
    const time2 = getDateTimeAttributeValue(attribute2);

    const calculateDateDifference = (date1, date2, unit) => {
      if (!date1 || !date2 || isNaN(date1.getTime()) || isNaN(date2.getTime())) {
        console.error("Invalid dates for date_diff:", date1, date2);
        return 0;
      }

      const diffInMilliseconds = Math.abs(date1 - date2);

      switch (unit) {
        case "years":
          return Math.floor(diffInMilliseconds / (365 * 24 * 60 * 60 * 1000));

        case "months":
          return Math.floor(diffInMilliseconds / (30 * 24 * 60 * 60 * 1000));

        case "days":
          return Math.floor(diffInMilliseconds / (24 * 60 * 60 * 1000));

        default:
          console.error("Unknown date unit:", unit);
          return 0;
      }
    };

    const calculateTimeDifference = (time1, time2, unit) => {
      if (!time1 || !time2 || isNaN(time1.getTime()) || isNaN(time2.getTime())) {
        console.error("Invalid times for time_diff:", time1, time2);
        return 0;
      }

      const diffInSeconds = Math.abs(time1 - time2) / 1000;

      switch (unit) {
        case "seconds":
          return Math.floor(diffInSeconds);

        case "minutes":
          return Math.floor(diffInSeconds / 60);

        case "hours":
          return Math.floor(diffInSeconds / (60 * 60));

        default:
          console.error("Unknown time unit:", unit);
          return 0;
      }
    };

    switch (specialFunction) {
      case "date_diff":
        return calculateDateDifference(date1, date2, unit);

      case "time_diff":
        return calculateTimeDifference(time1, time2, unit);

      default:
        console.error("Unknown special function:", specialFunction);
        return 0;
    }
  } catch (error) {
    console.error("Error in evaluateSpecialFunction:", error);
    return 0;
  }
}

// Helper function to perform logical operations
function performLogicalOperation(operand1, operator, operand2) {
  if (operator === undefined || operator === null) {
    console.error("Undefined logical operator");
    return false;
  }

  switch (operator) {
    case "&&":
      return Boolean(operand1) && Boolean(operand2);
    case "||":
      return Boolean(operand1) || Boolean(operand2);
    default:
      console.error("Unknown logical operator:", operator);
      return false;
  }
}