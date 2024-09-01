'use client'
import React, { useState } from 'react';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';

export default function Home() {
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content: "Hi, I'm the Rate My Professor support assistant. How can I help you today?"
    }
  ]);

  const [message, setMessage] = useState('');

  const sendMessage = async () => {
    const updatedMessages = [...messages, { role: "user", content: message }];

    // Add the user's message to the chat
    setMessages(updatedMessages);

    setMessage('');

    // Fetch the assistant's response
    const response = await fetch('/api/chat', {
      method: "POST",
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(updatedMessages),
    });

    const reader = response.body.getReader();
    const decoder = new TextDecoder();

    let result = '';
    reader.read().then(function processText({ done, value }) {
      if (done) return;

      const text = decoder.decode(value || new Uint8Array(), { stream: true });
      setMessages((messages) => {
        const lastMessage = messages[messages.length - 1];
        return [
          ...messages.slice(0, messages.length - 1),
          { ...lastMessage, content: lastMessage.content + text }
        ];
      });

      return reader.read().then(processText);
    });
  };

  return (
    <Box width="100vw" height="100vh" display="flex" flexDirection="column" justifyContent="center" alignItems="center">
      <Stack direction="column" width="500px" height="700px" border="1px solid black" p={2} spacing={3}>
        <Stack direction="column" spacing={2} flexGrow={1} overflow={"auto"} maxHeight={"100%"}>
          {messages.map((message, index) => (
            <Box key={index} display="flex" justifyContent={message.role === "assistant" ? "flex-start" : 'flex-end'}>
              <Box bgcolor={message.role === 'assistant' ? 'primary.main' : 'secondary.main'}
                color="white"
                borderRadius={16}
                p={3}>
                {message.content}
              </Box>
            </Box>
          ))}
        </Stack>
        <Stack direction="row" spacing={2}>
          <TextField
            label="Message"
            fullWidth
            value={message}
            onChange={(e) => setMessage(e.target.value)}
          />
          <Button variant="contained" onClick={sendMessage}>Send</Button>
        </Stack>
      </Stack>
    </Box>
  );
}
