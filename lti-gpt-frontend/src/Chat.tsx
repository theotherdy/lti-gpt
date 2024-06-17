import React, { useState, useEffect } from 'react';

import { Alert } from '@instructure/ui-alerts'
import { Button } from '@instructure/ui-buttons'
import { ScreenReaderContent } from '@instructure/ui-a11y-content'
import { Text } from '@instructure/ui-text'
import { TextInput } from '@instructure/ui-text-input'

function Chat() {
    const [message, setMessage] = useState('');
    const [response, setResponse] = useState('');
    const [llmIsSet, setLlmIsSet] = useState(false);
    const [apiKey, setApiKey] = useState('');
    const [contextTitle, setContextTitle] = useState('');
    //const [isApiKeyRequired, setIsApiKeyRequired] = useState(false);

    const token = "eyJraWQiOiJsdGktand0LWlkIiwidHlwIjoiSldUIiwiYWxnIjoiUlMyNTYifQ.eyJodHRwczpcL1wvcHVybC5pbXNnbG9iYWwub3JnXC9zcGVjXC9sdGlcL2NsYWltXC9sdGkxMV9sZWdhY3lfdXNlcl9pZCI6IjdlYjdjZDQxYmRjYWM2MTMxZDcyMzBlOTVmNzllNDBhYzczMzdlODgiLCJzdWIiOiIyZDRjMTJmOC0yYThjLTQyODUtOWM2YS04MTZiNDljYmYxODUiLCJodHRwczpcL1wvcHVybC5pbXNnbG9iYWwub3JnXC9zcGVjXC9sdGlcL2NsYWltXC9kZXBsb3ltZW50X2lkIjoiMzM5ODE6YjFkM2ZkZjE2MGE2NjllODYyOGRhZjU0NjljN2RkZDk4Y2RhZDc5YiIsImh0dHBzOlwvXC9wdXJsLmltc2dsb2JhbC5vcmdcL3NwZWNcL2x0aVwvY2xhaW1cL3ZlcnNpb24iOiIxLjMuMCIsImh0dHBzOlwvXC9wdXJsLmltc2dsb2JhbC5vcmdcL3NwZWNcL2x0aVwvY2xhaW1cL2x0aTFwMSI6eyJ1c2VyX2lkIjoiN2ViN2NkNDFiZGNhYzYxMzFkNzIzMGU5NWY3OWU0MGFjNzMzN2U4OCIsInZhbGlkYXRpb25fY29udGV4dCI6bnVsbCwiZXJyb3JzIjp7ImVycm9ycyI6e319fSwiaXNzIjoiaHR0cHM6XC9cL2x0aS5jYW52YXMub3guYWMudWsiLCJsb2NhbGUiOiJlbi1HQiIsImh0dHBzOlwvXC9wdXJsLmltc2dsb2JhbC5vcmdcL3NwZWNcL2x0aVwvY2xhaW1cL3Rvb2xfcGxhdGZvcm0iOnsidmFsaWRhdGlvbl9jb250ZXh0IjpudWxsLCJuYW1lIjoiVW5pdmVyc2l0eSBvZiBPeGZvcmQiLCJndWlkIjoiNWtCSFF5aHY3WFB0YnE4NGc4WTRLWWJ5SG1yUzdvZFVSUjZOcmlCdjpjYW52YXMtbG1zIiwicHJvZHVjdF9mYW1pbHlfY29kZSI6ImNhbnZhcyIsInZlcnNpb24iOiJjbG91ZCIsImVycm9ycyI6eyJlcnJvcnMiOnt9fX0sImh0dHBzOlwvXC9wdXJsLmltc2dsb2JhbC5vcmdcL3NwZWNcL2x0aVwvY2xhaW1cL2N1c3RvbSI6eyJwZXJzb25fbmFtZV9naXZlbiI6IkRhbWlvbiIsImNhbnZhc191c2VyX3ByZWZlcnNfaGlnaF9jb250cmFzdCI6ImZhbHNlIiwiY2FudmFzX2FjY291bnRfaWQiOiI0IiwicGVyc29uX25hbWVfZmFtaWx5IjoiWW91bmciLCJjYW52YXNfdXNlcl9zaXNfaWQiOiJtZGl2MDA0NCIsImNhbnZhc19hY2NvdW50X25hbWUiOiIyQiBNZWRpY2FsIFNjaWVuY2VzIiwiY2FudmFzX2FwaV9iYXNlX3VybCI6Imh0dHBzOlwvXC9jYW52YXMub3guYWMudWsiLCJiYWNrZW5kIjoiaHR0cHM6XC9cL2V4dGVybmFsLXVzZXItbWd0LmNhbnZhcy5veC5hYy51ayIsInBlcnNvbl9lbWFpbF9wcmltYXJ5IjoiZGFtaW9uLnlvdW5nQG1lZHNjaS5veC5hYy51ayIsImNhbnZhc19tZW1iZXJzaGlwX3JvbGVzIjoiQWNjb3VudCBBZG1pbixMb2NhbCBDYW52YXMgQ29vcmRpbmF0b3IiLCJjYW52YXNfdXNlcl9pZCI6IjM5IiwiY29tX2luc3RydWN0dXJlX2JyYW5kX2NvbmZpZ19qc29uX3VybCI6Imh0dHBzOlwvXC9kdTExaGpjdngwdXFiLmNsb3VkZnJvbnQubmV0XC9kaXN0XC9icmFuZGFibGVfY3NzXC9mNTU3NDU1NWE5MjM4M2YxMDA2YWFhNGRmOTkzMGU1MVwvdmFyaWFibGVzLTdkZDRiODA5MThhZjBlMDIxOGVjMDIyOWU0YmQ1ODczLmpzb24ifSwiaHR0cHM6XC9cL3d3dy5pbnN0cnVjdHVyZS5jb21cL3BsYWNlbWVudCI6ImFjY291bnRfbmF2aWdhdGlvbiIsImF6cCI6IjEyMjAxMDAwMDAwMDAwMDE1NiIsImh0dHBzOlwvXC9wdXJsLmltc2dsb2JhbC5vcmdcL3NwZWNcL2x0aVwvY2xhaW1cL2xpcyI6eyJjb3Vyc2Vfb2ZmZXJpbmdfc291cmNlZGlkIjoiJENvdXJzZVNlY3Rpb24uc291cmNlZElkIiwidmFsaWRhdGlvbl9jb250ZXh0IjpudWxsLCJwZXJzb25fc291cmNlZGlkIjoibWRpdjAwNDQiLCJlcnJvcnMiOnsiZXJyb3JzIjp7fX19LCJodHRwczpcL1wvcHVybC5pbXNnbG9iYWwub3JnXC9zcGVjXC9sdGlcL2NsYWltXC9sYXVuY2hfcHJlc2VudGF0aW9uIjp7ImRvY3VtZW50X3RhcmdldCI6ImlmcmFtZSIsInZhbGlkYXRpb25fY29udGV4dCI6bnVsbCwid2lkdGgiOjgwMCwicmV0dXJuX3VybCI6Imh0dHBzOlwvXC9jYW52YXMub3guYWMudWtcL2FjY291bnRzXC80XC9leHRlcm5hbF9jb250ZW50XC9zdWNjZXNzXC9leHRlcm5hbF90b29sX3JlZGlyZWN0IiwibG9jYWxlIjoiZW4tR0IiLCJlcnJvcnMiOnsiZXJyb3JzIjp7fX0sImhlaWdodCI6NDAwfSwiZXhwIjoxNzE4NjUwNjEzLCJpYXQiOjE3MTg2MjE4MTMsImVtYWlsIjoiZGFtaW9uLnlvdW5nQG1lZHNjaS5veC5hYy51ayIsInRvb2xfc3VwcG9ydF9lbmRwb2ludCI6Imh0dHBzOlwvXC90b29scy5jYW52YXMub3guYWMudWsiLCJodHRwczpcL1wvcHVybC5pbXNnbG9iYWwub3JnXC9zcGVjXC9sdGlcL2NsYWltXC9yb2xlcyI6WyJodHRwOlwvXC9wdXJsLmltc2dsb2JhbC5vcmdcL3ZvY2FiXC9saXNcL3YyXC9pbnN0aXR1dGlvblwvcGVyc29uI0FkbWluaXN0cmF0b3IiLCJodHRwOlwvXC9wdXJsLmltc2dsb2JhbC5vcmdcL3ZvY2FiXC9saXNcL3YyXC9pbnN0aXR1dGlvblwvcGVyc29uI0luc3RydWN0b3IiLCJodHRwOlwvXC9wdXJsLmltc2dsb2JhbC5vcmdcL3ZvY2FiXC9saXNcL3YyXC9pbnN0aXR1dGlvblwvcGVyc29uI1N0dWRlbnQiLCJodHRwOlwvXC9wdXJsLmltc2dsb2JhbC5vcmdcL3ZvY2FiXC9saXNcL3YyXC9zeXN0ZW1cL3BlcnNvbiNVc2VyIl0sImdpdmVuX25hbWUiOiJEYW1pb24iLCJub25jZSI6IjA5MjI5NTY2LWIyNTEtNGI1Ni1iMmE0LTQ2MDU2Njg0ZTY1ZCIsImh0dHBzOlwvXC9wdXJsLmltc2dsb2JhbC5vcmdcL3NwZWNcL2x0aVwvY2xhaW1cL3Jlc291cmNlX2xpbmsiOnsidmFsaWRhdGlvbl9jb250ZXh0IjpudWxsLCJkZXNjcmlwdGlvbiI6bnVsbCwiaWQiOiI5NzJmY2E2Zjg4YTc2NjU0Njc5OTc3NmFjODI4N2RmODFlMmJiZTJjIiwidGl0bGUiOiIyQiBNZWRpY2FsIFNjaWVuY2VzIiwiZXJyb3JzIjp7ImVycm9ycyI6e319fSwiaHR0cHM6XC9cL3B1cmwuaW1zZ2xvYmFsLm9yZ1wvc3BlY1wvbHRpXC9jbGFpbVwvdGFyZ2V0X2xpbmtfdXJpIjoiaHR0cHM6XC9cL3N0YXRpYy5jYW52YXMub3guYWMudWtcL2V4dC11c2VyLW1ndFwvaW5kZXguaHRtbCIsImh0dHBzOlwvXC9wdXJsLmltc2dsb2JhbC5vcmdcL3NwZWNcL2x0aVwvY2xhaW1cL2NvbnRleHQiOnsidmFsaWRhdGlvbl9jb250ZXh0IjpudWxsLCJpZCI6Ijk3MmZjYTZmODhhNzY2NTQ2Nzk5Nzc2YWM4Mjg3ZGY4MWUyYmJlMmMiLCJ0aXRsZSI6IjJCIE1lZGljYWwgU2NpZW5jZXMiLCJ0eXBlIjpbIkFjY291bnQiXSwiZXJyb3JzIjp7ImVycm9ycyI6e319fSwicGljdHVyZSI6Imh0dHBzOlwvXC9jYW52YXMub3guYWMudWtcL2ltYWdlc1wvdGh1bWJuYWlsc1wvMTMyOThcL0hibkVobEpIMUZpU0xXWVRabFBseFlFODNpRzY5NE1LbThuQ1N0ZlAiLCJhdWQiOiIxMjIwMTAwMDAwMDAwMDAxNTYiLCJodHRwczpcL1wvcHVybC5pbXNnbG9iYWwub3JnXC9zcGVjXC9sdGlcL2NsYWltXC9tZXNzYWdlX3R5cGUiOiJMdGlSZXNvdXJjZUxpbmtSZXF1ZXN0IiwiaXNzLW9yaWciOiJodHRwczpcL1wvY2FudmFzLmluc3RydWN0dXJlLmNvbSIsIm5hbWUiOiJEYW1pb24gWW91bmciLCJmYW1pbHlfbmFtZSI6IllvdW5nIiwiZXJyb3JzIjp7ImVycm9ycyI6e319fQ.KHmcERC5hLEl4rHi41uE5MXhghaW_OC6a3PXEG47jSWXKVssLrpyicildzTieqzcekXkiGBd77CW5Q3_SH488tcKCUSQ8oMeDH91281Tp5lVpXNtiu6vc51gBmmxTN6OL6YL1abAQS6kjY2kO6bii_vKHL6FLhcN-0NNMxRdLweyPwG1e1Jk2INXf51olozawwxHaQ6qeoUjP3XdUsnNgKUwVM3TcQtx0LCFconVND7cRe-DBk6zL_Fp_0W4c-VshQ1ZjKJJvzyr6gW_BpXOaQDFzAvi0s7auAwvimTbmuNBgAEUQrXYxpvdK-6hPyQWKmJ_6rKdGR1VYoXxDzTXRg"

    useEffect(() => {
        // Check for existing API key
        fetch('http://localhost/api/show-current', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
            },
        })
        .then(response => response.json())
        .then(data => {
            if (data.status === 'success' && data.data != null) {
                setLlmIsSet(true);
            } 
            //console.log(data.data);
            setContextTitle(data.data.lms_context_title);
        })
        .catch((error) => console.error('Error fetching llm for this context:', error));
    }, []);

    const handleApiKeySubmit = () => {
        fetch('http://localhost/api/llm/store', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ llm: apiKey }),
        })
        .then((res) => res.json())
        .then((data) => {
            if (data.success) {
                setIsApiKeyRequired(false);
            } else {
                alert('Error storing API key');
            }
        })
        .catch((error) => console.error('Error storing API key:', error));
    };

    const sendMessage = async () => {
        setResponse('');
        try {
            const res = await fetch('http://localhost:8000/api/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${apiKey}`,
                },
                body: JSON.stringify({ message }),
            });

            if (!res.body) {
                throw new Error('Response body is null');
            }

            const reader = res.body.getReader();
            const decoder = new TextDecoder();
            let partialResponse = '';

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                partialResponse += decoder.decode(value, { stream: true });
                setResponse((prev) => prev + partialResponse);
            }
        } catch (error) {
            console.error('Error sending message:', error);
        }
    };

    if (!llmIsSet) {
        return (
            <>
                <Alert
                    variant="warning"
                    margin="small"
                >
                    No ChatGPT API key set for: {contextTitle}
                </Alert>
                <form>
                    <TextInput
                        //value={apiKey}
                        display="inline-block"
                        renderLabel={<ScreenReaderContent>API Key</ScreenReaderContent>}
                        placeholder="ChatGPT API Key"
                        onChange={(e) => setApiKey(e.target.value)}
                    />
                    <Button onClick={handleApiKeySubmit}>Submit</Button>
                </form>
            </>
        );
    }

    return (
        <div>
            <input
                type="text"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
            />
            <button onClick={sendMessage}>Send</button>
            <div>{response}</div>
        </div>
    );
}

export default Chat;
