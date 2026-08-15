async function seedViaAPI() {
    try {
        console.log('1. Logging in as Admin...');
        const loginRes = await fetch('http://localhost:5000/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: 'admin@lankalivestock.com',
                password: 'Admin123!'
            })
        });

        const loginData = await loginRes.json();
        if (!loginData.success) {
            console.error('Login failed:', loginData.message);
            process.exit(1);
        }

        const token = loginData.data.token;
        console.log('✓ Logged in as Admin! Token acquired.');

        // 2. Get existing batches
        const batchesRes = await fetch('http://localhost:5000/api/poultry/batches', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const batchesData = await batchesRes.json();
        let batchList = batchesData.data || [];
        let batchId;

        if (batchList.length === 0) {
            console.log('2. Creating sample Poultry Batch...');
            const createBatchRes = await fetch('http://localhost:5000/api/poultry/batches', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    batch_name: 'Batch-2026-01 (Broiler)',
                    initial_birds: 500,
                    breed: 'Cobb 500',
                    stage: 'Grower',
                    raised_for: 'Broiler Meat'
                })
            });
            const newBatchData = await createBatchRes.json();
            batchId = newBatchData.data._id;
            console.log('✓ Created sample batch:', newBatchData.data.batch_name, '(ID:', batchId + ')');
        } else {
            batchId = batchList[0]._id;
            console.log('✓ Found existing batch:', batchList[0].batch_name, '(ID:', batchId + ')');
        }

        // 3. Post 2 sample Daily Logs
        console.log('3. Posting sample Daily Logs...');
        const today = new Date().toISOString().split('T')[0];
        const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

        const log1Res = await fetch('http://localhost:5000/api/poultry/logs', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                batch_id: batchId,
                date: yesterday,
                mortality_count: 2,
                feed_consumed_kg: 45.5,
                average_weight_kg: 1.75
            })
        });
        const log1 = await log1Res.json();

        const log2Res = await fetch('http://localhost:5000/api/poultry/logs', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                batch_id: batchId,
                date: today,
                mortality_count: 3,
                feed_consumed_kg: 48.0,
                average_weight_kg: 1.82
            })
        });
        const log2 = await log2Res.json();

        console.log('\n======================================');
        console.log('✓ Sample Daily Logs Successfully Posted via API!');
        console.log('  Log 1:', yesterday, '| Mortality: 2 | Feed: 45.5 kg | Weight: 1.75 kg');
        console.log('  Log 2:', today, '| Mortality: 3 | Feed: 48.0 kg | Weight: 1.82 kg');
        console.log('======================================\n');

        process.exit(0);
    } catch (err) {
        console.error('Error posting sample data via API:', err.message);
        process.exit(1);
    }
}

seedViaAPI();
