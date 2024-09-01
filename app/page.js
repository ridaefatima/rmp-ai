"use client";

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
    const userMessage = { role: "user", content: message };
    const updatedMessages = [...messages, userMessage];
    
    // Add the user's message to the chat
    setMessages(updatedMessages);
    
    setMessage('');
    
    // Fetch the assistant's response
    try {
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

      const processText = async () => {
        const { done, value } = await reader.read();
        if (done) {
          // Add the assistant's response as a new message
          setMessages((prevMessages) => [
            ...prevMessages,
            { role: "assistant", content: result }
          ]);
          return;
        }
        result += decoder.decode(value, { stream: true });
        processText();
      };
      
      processText();
    } catch (error) {
      console.error("Error fetching assistant response:", error);
    }
  };

  const renderMessageContent = (content, role) => {
    const boxProps = {
      borderRadius: 2,
      p: 2,
      maxWidth: '80%',
      overflowWrap: 'break-word',
      wordBreak: 'break-word',
    };

    // Determine background color based on the role
    const bgColor = role === 'user' ? '#d1c4e9' : '#bbdefb'; // Light purple for user, light blue for assistant

    return (
      <Box {...boxProps} bgcolor={bgColor} color='black'>
        {content}
      </Box>
    );
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
