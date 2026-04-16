import React, { useState } from 'react';

const AddData = () => {
  const [text, setText] = useState('');
  const [status, setStatus] = useState('');

  const handleUpload = async () => {
    if (!text) return alert("Please enter movie info!");
    setStatus('Uploading...');

    try {
      const response = await fetch('/api/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      });

      const data = await response.json();
      if (response.ok) {
        setStatus('✅ Vector stored successfully!');
        setText(''); // Clear the box
      } else {
        setStatus(`❌ Error: ${data.error}`);
      }
    } catch (err) {
      setStatus('❌ Failed to connect to server.');
    }
  };

  return (
    <div style={{ padding: '20px', border: '1px solid #ddd', borderRadius: '8px', marginTop: '20px' }}>
      <h3>Add Movie Knowledge</h3>
      <textarea
        style={{ width: '100%', height: '100px', marginBottom: '10px' }}
        placeholder="Paste movie description here (e.g. Inception is about dreams...)"
        value={text}
        onChange={(e) => setText(e.target.value)}
      />
      <button 
        onClick={handleUpload}
        style={{ padding: '10px 20px', cursor: 'pointer', background: '#4f46e5', color: 'white', border: 'none', borderRadius: '5px' }}
      >
        Upload to Pinecone
      </button>
      {status && <p>{status}</p>}
    </div>
  );
};

export default AddData;