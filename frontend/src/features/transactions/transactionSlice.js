import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../../services/api";

// Fetch all transactions
export const fetchTransactions = createAsyncThunk(
    "transactions/fetchAll",
    async (_, { rejectWithValue }) => {
        try {
            const response = await api.get("/transactions");
            return response.data.data; // Contains { transactions, stats }
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || "Failed to fetch");
        }
    }
);

// Add new transaction
export const addTransaction = createAsyncThunk(
    "transactions/add",
    async (transactionData, { rejectWithValue }) => {
        try {
            const response = await api.post("/transactions", transactionData);
            return response.data.data;
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || "Failed to add");
        }
    }
);

// New: Delete transaction
export const removeTransaction = createAsyncThunk(
    "transactions/delete",
    async (id, { rejectWithValue }) => {
        try {
            await api.delete(`/transactions/${id}`);
            return id; // Return the ID so we can remove it from state
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || "Failed to delete");
        }
    }
);

const transactionSlice = createSlice({
    name: "transactions",
    initialState: {
        items: [],
        stats: { income: 0, expense: 0, balance: 0 },
        loading: false,
        error: null,
    },
    reducers: {},
    extraReducers: (builder) => {
        builder
            /* --- Fetch Transactions --- */
            .addCase(fetchTransactions.pending, (state) => {
                state.loading = true;
            })
            .addCase(fetchTransactions.fulfilled, (state, action) => {
                state.loading = false;
                state.items = action.payload.transactions;
                state.stats = action.payload.stats;
            })
            .addCase(fetchTransactions.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })

            /* --- Add Transaction --- */
            .addCase(addTransaction.fulfilled, (state, action) => {
                const newTx = action.payload;
                state.items.unshift(newTx);
                
                const amount = Number(newTx.amount);
                if (newTx.type === 'income') {
                    state.stats.income += amount;
                    state.stats.balance += amount;
                } else {
                    state.stats.expense += amount;
                    state.stats.balance -= amount;
                }
            })

            /* --- Delete Transaction --- */
            .addCase(removeTransaction.fulfilled, (state, action) => {
                const deletedId = action.payload;
                // Find the item before we kill it to know how much to subtract from stats
                const itemToDelete = state.items.find(item => item._id === deletedId);
                
                if (itemToDelete) {
                    const amount = Number(itemToDelete.amount);
                    if (itemToDelete.type === 'income') {
                        state.stats.income -= amount;
                        state.stats.balance -= amount;
                    } else {
                        state.stats.expense -= amount;
                        state.stats.balance += amount;
                    }
                    // Filter out the deleted item
                    state.items = state.items.filter(item => item._id !== deletedId);
                }
            });
    },
});

export default transactionSlice.reducer;