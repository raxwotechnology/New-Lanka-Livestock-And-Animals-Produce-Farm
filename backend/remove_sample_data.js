async function removeSampleData() {
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

        // 2. Fetch all batches to find 'Batch-2026-01 (Broiler)'
        const batchesRes = await fetch('http://localhost:5000/api/poultry/batches', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const batchesData = await batchesRes.json();
        const sampleBatches = (batchesData.data || []).filter(b => b.batch_name.includes('Batch-2026-01'));

        // 3. Delete sample batches
        for (const batch of sampleBatches) {
            console.log(`Deleting batch ${batch.batch_name} (${batch._id})...`);
            await fetch(`http://localhost:5000/api/poultry/batches/${batch._id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
        }

        // 4. Fetch all logs and delete sample logs
        const logsRes = await fetch('http://localhost:5000/api/poultry/logs', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const logsData = await logsRes.json();
        for (const log of (logsData.data || [])) {
            if (!log.batch_id || log.batch_id.batch_name?.includes('Batch-2026-01') || log.batch_id === sampleBatches[0]?._id) {
                console.log(`Deleting log ${log._id}...`);
                await fetch(`http://localhost:5000/api/poultry/logs/${log._id}`, {
                    method: 'DELETE',
                    headers: { 'Authorization': `Bearer ${token}` }
                });
            }
        }

        console.log('\n======================================');
        console.log('✓ All Sample Data Successfully Removed!');
        console.log('======================================\n');

        process.exit(0);
    } catch (err) {
        console.error('Error removing sample data:', err.message);
        process.exit(1);
    }
}

removeSampleData();
