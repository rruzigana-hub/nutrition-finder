require('net').setDefaultAutoSelectFamilyAttemptTimeout(3000);
require('dns').setDefaultResultOrder('ipv4first');
require('dotenv').config();
const express = require('express');
const path = require('path');
const os = require('os');
const app = express();
const PORT = process.env.PORT || 3000;
const API_KEY = process.env.USDA_API_KEY;

const cache = new Map();
const CACHE_MS = 10 * 60 * 1000;

app.use(express.static(path.join(__dirname, 'public')));

app.get('/api/server', (req, res) => {
    res.json({server: os.hostname() });
});

app.get('/api/search', async (req, res) => {
    const query = (req.query.q || '').trim();

    if (!query) {
        return res.status(400).json({error: 'Please type a food name.' });
    }
    if (query.length > 60) {
        return res.status(400).json({ error: 'Search text is too long.'});
    }
    if (!API_KEY) {
        return res.status(500).json({ error: 'Server has no API key.'});
    }
    
    const cacheKey = query.toLowerCase();
    const hit = cache.get(cacheKey);
    if (hit && (Date.now() - hit.time < CACHE_MS)) {
        return res.json({ foods: hit.foods, cached: true, server: os.hostname() });
    }

    const url = 'https://api.nal.usda.gov/fdc/v1/foods/search' + `?api_key=${API_KEY}&query=${encodeURIComponent(query)}` + '&pageSize=25&dataType=Foundation,SR%20Legacy';

    try {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), 6000);
        const response = await fetch(url, { signal: controller.signal });
        clearTimeout(timer);

        if (response.status === 429) {
            return res.status(429).json({ error: 'Too many requests. Wait a minute and try again.' });
        }
        if (!response.ok) {
            return res.status(502).json({ error: 'Food service returned an error. try again later.'});
        } 
        
        const data = await response.json();
        const pick = (food, id) => {
            const n = (food.foodNutrients || []).find((x) => x.nutrientId === id);
            return n ? n.value : 0;
        };

        const foods = (data.foods || []).map((f) => ({
            name: f.description,
            category: f.foodCategory || 'Other',
            calories: pick(f, 1008),
            protein: pick(f, 1003),
            fat: pick(f, 1004),
            carbs: pick(f, 1005),
        }));

        cache.set(cacheKey,{ foods,  time: Date.now() });
        res.json({ foods, cached: false, server: os.hostname() });
            
    } catch (err) {
        console.error(err);
        if (err.name === 'AbortError') {
            return res.status(504).json({ error: 'Food services too slow. Try again later.' });
        }

        res.status(500).json({ error: 'Could not reach the food service. Check your internet.'});
    }
});    


app.listen(PORT, () => {
    console.log(`Nutrition Finder running on port ${PORT}`);
})