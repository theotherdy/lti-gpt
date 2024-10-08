import React, { useEffect, useState } from 'react';

import { Table } from '@instructure/ui-table'

export interface User {
    id: number;
    sub: string;
    first_name: string;
    last_name: string;
    email: string;
  }
  
  export interface Conversation {
    id: number;
    context_user_id: number;
    messages_sent_count: number;
    messages_received_count: number;
    tokens_sent: number;
    tokens_received: number;
    updated_at: string;
  }
  
  export interface ContextUser {
    id: number;
    user: User;
    conversations: Conversation[];
  }
  
  export interface ApiResponse {
    status: string;
    data: ContextUser[];
  }

  interface UserConversationsSummaryProps {
    baseAPIUrl: string;
    token: string;
  }

  const UserConversationsSummary: React.FC<UserConversationsSummaryProps> = ({ baseAPIUrl, token }) => {
    const [data, setData] = useState<ContextUser[] | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
  
    useEffect(() => {
      const fetchData = async () => {
        try {
            const response = await fetch(`${baseAPIUrl}api/conversations/summary`, {
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${token}`,
                },
              });
          if (!response.ok) {
            throw new Error('Network response was not ok');
          }
          const result: ApiResponse = await response.json();
          setData(result.data);
        } catch (error: unknown) {
          if (error instanceof Error) {
            setError(error.message);
          } else {
            setError('An unknown error occurred');
          }
        } finally {
          setLoading(false);
        }
      };
  
      fetchData();
    }, []);
  
    if (loading) {
      return <p>Loading...</p>;
    }
  
    if (error) {
      return <p>Error: {error}</p>;
    }
  
    if (!data || data.length === 0) {
      return <p>No data available</p>;
    }
  
    return (
      <div>
        <h1>User Conversations Summary</h1>
        <Table
          caption='User Conversations'
          hover={true}
        >
          <Table.Head>
            <Table.Row>
              <Table.ColHeader id="ID">User id</Table.ColHeader>
              <Table.ColHeader id="Name">User name</Table.ColHeader>
              <Table.ColHeader id="UpdatedAt">Date</Table.ColHeader>
              <Table.ColHeader id="MSent">Messages Sent</Table.ColHeader>
              <Table.ColHeader id="MReceived">Messages Received</Table.ColHeader>
              <Table.ColHeader id="TSent">Tokens Sent</Table.ColHeader>
              <Table.ColHeader id="TReceived">Tokens Received</Table.ColHeader>
            </Table.Row>
          </Table.Head>
          <Table.Body>
            {data.map((user) => 

              
                user.conversations.map((convo) => (
                  <Table.Row key={convo.id}>
                    <Table.RowHeader>{user.id}</Table.RowHeader>
                    <Table.Cell>{'Anonymous'}</Table.Cell>
                    <Table.Cell>{new Date(convo.updated_at).toLocaleString()}</Table.Cell>
                    <Table.Cell>{convo.messages_sent_count}</Table.Cell>
                    <Table.Cell>{convo.messages_received_count}</Table.Cell>
                    <Table.Cell>{convo.tokens_sent}</Table.Cell>
                    <Table.Cell>{convo.tokens_received}</Table.Cell>
                  </Table.Row>
                ))
              
            )}
          </Table.Body>
        </Table>
      </div>
    );
  };
  
  export default UserConversationsSummary;