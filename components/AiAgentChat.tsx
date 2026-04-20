'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Send, Bot, User, AlertCircle, Zap, TrendingUp, Eye, ShoppingCart, Target, Search, BarChart2, Briefcase, Users, MessageSquare } from 'lucide-react';
import { chatWithAgent, type ChatMessage, type AIProviderConfig } from '@/lib/aiClient';
import { getDemoResponse } from '@/lib/demoData';
import ReactMarkdown from 'react-markdown';

interface Message extends ChatMessage {
  id: string;
}

interface ClientProfile {
  niche?: string;
  product?: string;
  objective?: string;
  ticket?: string;
  differentials?: string;
}

interface AiAgentChatProps {
  aiConfig: AIProviderConfig;
  metaContext?: string;
  hasMetaData: boolean;
  clientProfile?: ClientProfile;
}

const QUICK_ACTIONS = [
  { icon: Search, label: '/fullaudit', description: 'Auditoria completa da conta' },
  { icon: TrendingUp, label: '/escala', description: 'Oportunidades de escalada' },
  { icon: AlertCircle, label: '/bleeding', description: 'Onde o dinheiro está vazando' },
  { icon: Eye, label: '/criativos', description: 'Ranking e score dos anúncios' },
  { icon: Target, label: '/publicos', description: 'Análise dos públicos' },
  { icon: BarChart2, label: '/funil', description: 'Análise do funil de conversão' },
  { icon: Users, label: '/leads', description: 'Qualidade de lead e otimizações' },
  { icon: Briefcase, label: '/estrategia', description: 'Estratégia completa para o nicho' },
  { icon: MessageSquare, label: 'Quais públicos usar para esse nicho?', description: 'Segmentações recomendadas' },
  { icon: ShoppingCart, label: 'Quais criativos devo escalar agora?', description: 'Decisão de escala' },
  { icon: Zap, label: 'Como melhorar a qualidade dos meus leads?', description: 'Lead quality optimization' },
];

function buildClientContext(profile?: ClientProfile): string {
  if (!profile?.niche && !profile?.product) return '';
  const lines: string[] = ['PERFIL DO CLIENTE:'];
  if (profile.niche) lines.push(`Nicho: ${profile.niche}`);
  if (profile.product) lines.push(`Produto/Serviço: ${profile.product}`);
  if (profile.objective) lines.push(`Objetivo: ${profile.objective}`);
  if (profile.ticket) lines.push(`Ticket médio: R$ ${profile.ticket}`);
  if (profile.differentials) lines.push(`Diferenciais/Objeções: ${profile.differentials}`);
  return lines.join(' | ');
}

function getWelcomeMessage(hasMetaData: boolean, profile?: ClientProfile): string {
  const nicheHint = profile?.niche
    ? `\n\nVejo que você está no nicho de **${profile.niche}**${profile.product ? ` com o produto "${profile.product}"` : ''}. Vou adaptar todas as análises e estratégias especificamente para esse mercado.`
    : '';

  if (hasMetaData) {
    return `Olá! Sou **ARIA**, seu Agente de Inteligência de Anúncios Meta.${nicheHint}\n\nSeus dados de campanha foram carregados. Use os **Atalhos Rápidos** abaixo ou me faça qualquer pergunta:\n\n- **/fullaudit** → Auditoria completa com P1/P2/P3\n- **/bleeding** → Onde o dinheiro está vazando agora\n- **/leads** → Como melhorar a qualidade dos seus leads\n- **/estrategia** → Estratégia completa para ${profile?.niche || 'seu nicho'}`;
  }
  return `Olá! Sou **ARIA**, seu Agente de Inteligência de Anúncios Meta — especializada em gerar leads qualificados e maximizar ROAS.${nicheHint}\n\nPosso ajudar você com:\n- **Estratégia completa** para o seu nicho (use **/estrategia**)\n- **Segmentações de público** de alta qualidade\n- **Roteiros de criativo** e hooks comprovados\n- **Auditoria** das suas campanhas (conecte a conta Meta primeiro)\n\nO que você quer resolver hoje?`;
}

export function AiAgentChat({ aiConfig, metaContext, hasMetaData, clientProfile }: AiAgentChatProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'agent',
      text: getWelcomeMessage(hasMetaData, clientProfile),
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showQuickActions, setShowQuickActions] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const buildFullContext = useCallback((messageText: string, isFirstMessage: boolean): string => {
    const parts: string[] = [];

    if (clientProfile?.niche || clientProfile?.product) {
      parts.push(buildClientContext(clientProfile));
    }

    if (metaContext && isFirstMessage) {
      parts.push(`DADOS DA CONTA META:\n${metaContext}`);
    }

    if (parts.length === 0) return messageText;
    return `${parts.join('\n\n')}\n\n---\nMENSAGEM: ${messageText}`;
  }, [clientProfile, metaContext]);

  const handleSend = async (text?: string) => {
    const messageText = text || input;
    if (!messageText.trim()) return;

    const isDemo = aiConfig.provider === 'demo';
    if (!isDemo && !aiConfig.apiKey) {
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          role: 'agent',
          text: `⚠️ **API Key não configurada.**\n\nVá em **⚙️ Configurações** e adicione sua chave de API, ou ative o **🎭 Modo Demo** para testar sem chave.`,
        },
      ]);
      return;
    }

    const newMsg: Message = { id: Date.now().toString(), role: 'user', text: messageText };
    setMessages((prev) => [...prev, newMsg]);
    setInput('');
    setIsLoading(true);
    setShowQuickActions(false);

    try {
      const history: ChatMessage[] = messages.map((m) => ({ role: m.role, text: m.text }));
      const isFirstMessage = history.filter((m) => m.role === 'user').length === 0;
      const enrichedMessage = buildFullContext(messageText, isFirstMessage);

      const responseText = await chatWithAgent(aiConfig, history, enrichedMessage, undefined);
      setMessages((prev) => [
        ...prev,
        { id: (Date.now() + 1).toString(), role: 'agent', text: responseText },
      ]);
    } catch (error: unknown) {
      const err = error as Error;
      const errMsg = err?.message || '';
      const isQuotaError = errMsg.includes('⏳') || errMsg.includes('Limite de requisições') || errMsg.includes('429') || errMsg.includes('quota');

      if (isQuotaError) {
        const demoFallback = getDemoResponse(messageText);
        setMessages((prev) => [
          ...prev,
          {
            id: (Date.now() + 1).toString(),
            role: 'agent',
            text: `> ⏳ *Quota da API atingida — respondendo via Modo Demo temporariamente. Aguarde 1 min ou troque para Gemini 1.5 Flash 8B nas Configurações.*\n\n${demoFallback}`,
          },
        ]);
      } else {
        setMessages((prev) => [
          ...prev,
          {
            id: (Date.now() + 1).toString(),
            role: 'agent',
            text: `**⚠️ Erro (${aiConfig.provider}):** ${errMsg || 'Falha na conexão. Verifique se sua chave API está correta e sem espaços extras.'}`,
          },
        ]);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const isDemo = aiConfig.provider === 'demo';
  const hasKey = !!aiConfig.apiKey || isDemo;
  const nicheLabel = clientProfile?.niche || clientProfile?.product;

  return (
    <div className="chat-container glass-panel">
      {/* Chat Header */}
      <div className="chat-header">
        <div className="agent-avatar">
          <Bot size={24} />
        </div>
        <div className="agent-info">
          <h3>ARIA — Meta Ads Intelligence Agent</h3>
          <p>
            Sênior Media Buyer & Estrategista ·{' '}
            {isDemo ? '🎭 Modo Demo' :
             aiConfig.provider === 'gemini' ? 'Google Gemini' :
             aiConfig.provider === 'openai' ? 'OpenAI GPT' :
             'Anthropic Claude'}
            {' '}· {aiConfig.model}
            {nicheLabel && <> · <span style={{ color: 'var(--accent-primary)' }}>🎯 {nicheLabel}</span></>}
          </p>
        </div>
        <div className="agent-status-badge">
          <span className="status-dot" />
          Online
        </div>
      </div>

      {/* Client niche badge */}
      {nicheLabel && (
        <div style={{ padding: '8px 20px', background: 'rgba(0,240,255,0.05)', borderBottom: '1px solid var(--glass-border)', fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'flex', gap: 8, alignItems: 'center' }}>
          <Target size={13} style={{ color: 'var(--accent-primary)', flexShrink: 0 }} />
          <span>Estratégia calibrada para <strong style={{ color: 'var(--accent-primary)' }}>{nicheLabel}</strong></span>
          {clientProfile?.objective && <span>· Objetivo: <strong>{clientProfile.objective}</strong></span>}
          {clientProfile?.ticket && <span>· Ticket: <strong>R$ {clientProfile.ticket}</strong></span>}
        </div>
      )}

      {/* Messages */}
      <div className="chat-messages">
        {messages.map((msg) => (
          <div key={msg.id} className={`message ${msg.role}`}>
            {msg.role === 'agent' && (
              <div className="agent-avatar" style={{ width: 36, height: 36, flexShrink: 0 }}>
                <Bot size={20} />
              </div>
            )}
            <div className="message-bubble markdown-body">
              {msg.role === 'agent' ? (
                <ReactMarkdown>{msg.text}</ReactMarkdown>
              ) : (
                msg.text
              )}
            </div>
            {msg.role === 'user' && (
              <div
                className="agent-avatar"
                style={{ width: 36, height: 36, background: 'var(--bg-tertiary)', color: 'var(--text-secondary)', flexShrink: 0 }}
              >
                <User size={20} />
              </div>
            )}
          </div>
        ))}

        {isLoading && (
          <div className="message agent">
            <div className="agent-avatar" style={{ width: 36, height: 36, flexShrink: 0 }}>
              <Bot size={20} />
            </div>
            <div className="typing-indicator">
              <div className="typing-dot" />
              <div className="typing-dot" />
              <div className="typing-dot" />
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Quick Actions */}
      {showQuickActions && (
        <div className="quick-actions-grid">
          {QUICK_ACTIONS.map((action) => (
            <button
              key={action.label}
              className="quick-action-btn"
              onClick={() => handleSend(action.label)}
              title={action.description}
            >
              <action.icon size={14} />
              <span>{action.label}</span>
            </button>
          ))}
        </div>
      )}

      {/* Input Area */}
      <div className="chat-input-area">
        {!hasKey && (
          <div style={{ color: 'var(--warning)', fontSize: '0.85rem', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <AlertCircle size={16} /> API Key não configurada. Configure em Configurações (⚙️) ou ative o Modo Demo.
          </div>
        )}
        {hasMetaData && (
          <div style={{ color: 'var(--success)', fontSize: '0.8rem', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--success)', display: 'inline-block' }} />
            Dados Meta carregados · O agente tem contexto completo das suas campanhas
          </div>
        )}
        <div className="input-wrapper">
          <input
            className="chat-input"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
            placeholder={nicheLabel ? `Pergunte sobre ${nicheLabel}, use /estrategia, /leads, /fullaudit...` : 'Faça uma pergunta ou use /fullaudit, /bleeding, /leads, /estrategia...'}
            disabled={isLoading}
          />
          <button className="send-btn" onClick={() => handleSend()} disabled={!input.trim() || isLoading}>
            <Send size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}
