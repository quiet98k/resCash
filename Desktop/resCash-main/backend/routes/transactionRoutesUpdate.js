// routes/transactionRoutes.js
import express from "express";
import mongoose from "mongoose";
import Transaction from "../models/Transaction.js";
import dotenv from "dotenv";

dotenv.config();

const router = express.Router();

// Update Transaction Route
router.post("/update", async (req, res) => {
  try {
    const {
      amount,
      transactionType,
      category,
      currency,
      notes,
      merchant,
      paymentMethod,
      timestamp,
      id,
    } = req.body;

    const updateData = {
      amount,
      transactionType,
      category,
      currency,
      notes,
      merchant,
      paymentMethod,
      timestamp: timestamp ? new Date(timestamp) : undefined,
    };

    // Update transaction in MongoDB
    const updatedTransaction = await Transaction.findByIdAndUpdate(
      id,
      updateData,
      { new: true }
    );

    if (!updatedTransaction) {
      return res.status(404).json({
        success: false,
        message: "Transaction not found after update",
      });
    }

    // GraphQL mutation to update transaction in ResilientDB
    const graphQLEndpoint = 'https://your-resilientdb-endpoint/graphql'; // Replace with your actual endpoint

    const mutation = `
      mutation UpdateTransaction($id: ID!, $input: TransactionInput!) {
        updateTransaction(id: $id, input: $input) {
          id
          amount
          transactionType
          category
          currency
          notes
          merchant
          paymentMethod
          timestamp
        }
      }
    `;

    const variables = {
      id: id,
      input: {
        amount: amount,
        transactionType: transactionType,
        category: category,
        currency: currency,
        notes: notes,
        merchant: merchant,
        paymentMethod: paymentMethod,
        timestamp: timestamp ? new Date(timestamp) : null,
      },
    };

    // Execute the GraphQL mutation
    const graphqlResponse = await fetch(graphQLEndpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: mutation,
        variables: variables,
      }),
    });

    const graphqlResult = await graphqlResponse.json();

    if (graphqlResult.errors) {
      console.error("Error updating transaction in ResilientDB:", graphqlResult.errors);
      // Optionally handle the error or return a response
    }

    res.status(200).json({
      success: true,
      message: "Transaction updated successfully",
      updatedTransaction,
    });
  } catch (error) {
    console.error("Error updating transaction:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Internal server error",
    });
  }
});

export default router;