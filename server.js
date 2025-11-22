const express = require('express');
const cors = require('cors');
const axios = require('axios');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Proxy endpoint cho Backblaze B2 API
app.post('/proxy', async (req, res) => {
    try {
        const { url, method, headers, data } = req.body;
        
        console.log('Proxying request to:', url);
        
        const response = await axios({
            method: method || 'POST',
            url: url,
            headers: headers || {},
            data: data
        });
        
        res.json(response.data);
    } catch (error) {
        console.error('Proxy error:', error.message);
        res.status(500).json({ error: error.message });
    }
});

// Health check endpoint
app.get('/', (req, res) => {
    res.send('B2 Proxy Server is running');
});

app.listen(PORT, () => {
    console.log(`Proxy server running on port ${PORT}`);
});