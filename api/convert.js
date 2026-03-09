export default async function handler(req, res) {
  // Allow CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const API_KEY = process.env.CLOUDCONVERT_API_KEY;
  if (!API_KEY) return res.status(500).json({ error: 'API key not configured' });

  try {
    const { action, jobId, uploadUrl, uploadParams, fileName, fileData, outputFormat } = req.body;

    // Action 1: Create job
    if (action === 'create_job') {
      const inputFormat = fileName.split('.').pop().toLowerCase();
      const jobRes = await fetch('https://api.cloudconvert.com/v2/jobs', {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer ' + API_KEY,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          tasks: {
            'upload-file': { operation: 'import/upload' },
            'convert-file': {
              operation: 'convert',
              input: 'upload-file',
              output_format: outputFormat.toLowerCase()
            },
            'export-file': {
              operation: 'export/url',
              input: 'convert-file'
            }
          }
        })
      });
      const job = await jobRes.json();
      return res.status(200).json(job);
    }

    // Action 2: Poll job status
    if (action === 'poll_job') {
      const pollRes = await fetch(`https://api.cloudconvert.com/v2/jobs/${jobId}`, {
        headers: { 'Authorization': 'Bearer ' + API_KEY }
      });
      const data = await pollRes.json();
      return res.status(200).json(data);
    }

    return res.status(400).json({ error: 'Invalid action' });

  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
