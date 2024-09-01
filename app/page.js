"use client"

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

    const responseData = await response.json();
    const assistantMessage = responseData.generated_text || "Sorry, I couldn't process your request.";

    setMessages((messages) => [
      ...messages,
      { role: "assistant", content: assistantMessage }
    ]);
  };

  const renderMessageContent = (content, role) => {
    const boxProps = {
      borderRadius: 2,
      p: 2,
      maxWidth: '80%',
      overflowWrap: 'break-word', // Use camelCase for word break
      wordBreak: 'break-word', // Use camelCase for word break
    };

    if (role === 'user') {
      return (
        <Box {...boxProps} bgcolor='purple' color='white'>
          {content}
        </Box>
      );
    } else {
      return (
        <Box {...boxProps} bgcolor='blue' color='white'>
          {content}
        </Box>
      );
    }
  };

  return (
    <Box width="100vw" height="100vh" display="flex" flexDirection="column" justifyContent="center" alignItems="center">
      <Stack direction="column" width="500px" height="700px" border="1px solid black" p={2} spacing={3}>
        <Stack direction="column" spacing={2} flexGrow={1} overflow="auto" maxHeight="100%">
          {messages.map((message, index) => (
            <Box key={index} display="flex" justifyContent={message.role === "assistant" ? "flex-start" : 'flex-end'}>
              {renderMessageContent(message.content, message.role)}
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
