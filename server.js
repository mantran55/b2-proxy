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
        console.log('Method:', method);
        console.log('Headers:', JSON.stringify(headers, null, 2));
        console.log('Data:', JSON.stringify(data, null, 2));
        
        if (!url) {
            throw new Error('URL is required');
        }
        
        // Tạo config cho axios
        const config = {
            method: method || 'POST',
            url: url,
            headers: {},
            validateStatus: function (status) {
                return status >= 200 && status < 300;
            }
        };
        
        // Xử lý headers - đảm bảo không có Content-Type khi không có body
        if (headers) {
            for (const [key, value] of Object.entries(headers)) {
                if (key.toLowerCase() === 'content-type' && !data) {
                    // Bỏ qua Content-Type nếu không có data
                    continue;
                }
                config.headers[key] = value;
            }
        }
        
        // Chỉ thêm data nếu có
        if (data !== null && data !== undefined) {
            config.data = data;
        }
        
        console.log('Final config:', JSON.stringify(config, null, 2));
        
        const response = await axios(config);
        
        res.json(response.data);
    } catch (error) {
        console.error('Proxy error:', error.message);
        console.error('Error details:', error);
        
        if (error.response) {
            // Server responded with error status
            console.error('Error response status:', error.response.status);
            console.error('Error response data:', error.response.data);
            return res.status(error.response.status).json({
                error: error.response.data,
                status: error.response.status
            });
        } else if (error.request) {
            // No response received
            console.error('No response received:', error.request);
            return res.status(502).json({ error: 'No response from Backblaze B2 API' });
        } else {
            // Request setup error
            console.error('Request setup error:', error.message);
            return res.status(500).json({ error: error.message });
        }
    }
});

// Health check endpoint
app.get('/', (req, res) => {
    res.send('B2 Proxy Server is running');
});

// Handle 404
app.use((req, res) => {
    res.status(404).json({ error: 'Endpoint not found' });
});

// Global error handler
app.use((err, req, res, next) => {
    console.error('Unhandled error:', err);
    res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, () => {
    console.log(`Proxy server running on port ${PORT}`);
});
