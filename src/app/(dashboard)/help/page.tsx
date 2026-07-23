'use client';

import { useState, useMemo } from 'react';
import {
  HelpCircle,
  Search,
  MessageSquare,
  Users,
  GitBranch,
  Radio,
  Zap,
  Settings,
  BookOpen,
  Copy,
  Check,
  ChevronDown,
  Sparkles,
  PhoneCall,
  ShieldCheck,
  Keyboard,
  ExternalLink,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface HelpTopic {
  id: string;
  category: 'whatsapp' | 'inbox' | 'contacts' | 'pipelines' | 'broadcasts' | 'automations' | 'settings';
  categoryLabel: string;
  categoryIcon: typeof MessageSquare;
  title: string;
  summary: string;
  steps: string[];
  snippet?: string;
  tip?: string;
}

const HELP_TOPICS: HelpTopic[] = [
  // WhatsApp API
  {
    id: 'whatsapp-meta-config',
    category: 'whatsapp',
    categoryLabel: 'WhatsApp & Meta API',
    categoryIcon: PhoneCall,
    title: 'Como conectar seu número do WhatsApp Business Cloud API',
    summary: 'Aprenda a obter e inserir as credenciais oficiais da Meta para enviar e receber mensagens.',
    steps: [
      'Acesse o painel "Meta for Developers" (developers.facebook.com) e selecione o seu aplicativo do WhatsApp.',
      'No menu esquerdo, navegue até WhatsApp → Configuração da API (API Setup).',
      'Copie o "ID do Número de Telefone" (Phone Number ID) e o "ID da Conta do WhatsApp Business" (WABA ID).',
      'Gere um "Token de Acesso Permanente" de sistema (System User Token) com permissões "whatsapp_business_messaging" e "whatsapp_business_management".',
      'No WA-CRM, vá em Configurações → aba WhatsApp, cole as credenciais e clique em "Salvar Configurações".',
    ],
    snippet: 'whatsapp_business_messaging, whatsapp_business_management',
    tip: 'Utilize um Token de Usuário do Sistema Permanente para evitar que a conexão expire a cada 24 horas.',
  },
  {
    id: 'whatsapp-webhook-setup',
    category: 'whatsapp',
    categoryLabel: 'WhatsApp & Meta API',
    categoryIcon: PhoneCall,
    title: 'Como configurar o Webhook para receber mensagens em tempo real',
    summary: 'Conecte o endpoint de webhook do seu CRM no painel da Meta para receber respostas instantaneamente.',
    steps: [
      'No painel Meta for Developers, vá em WhatsApp → Configuração do Webhook.',
      'No campo "URL de Retorno de Chamada" (Callback URL), insira a URL do seu servidor + /api/whatsapp/webhook.',
      'No campo "Token de Verificação", insira uma senha secreta à sua escolha.',
      'No WA-CRM, insira este mesmo Token de Verificação no arquivo de ambiente (.env.local ou Configurações) para validar a assinatura.',
      'Inscreva-se no campo de evento "messages" para que o CRM receba todas as mensagens de clientes.',
    ],
    snippet: 'https://seu-dominio.com/api/whatsapp/webhook',
    tip: 'Certifique-se de assinar o evento "messages" no painel da Meta para que as conversas cheguem à Caixa de Entrada.',
  },

  // Caixa de Entrada
  {
    id: 'inbox-24h-window',
    category: 'inbox',
    categoryLabel: 'Caixa de Entrada',
    categoryIcon: MessageSquare,
    title: 'Como funciona a Janela de Atendimento de 24 horas do WhatsApp',
    summary: 'Entenda a política oficial da Meta para início de conversas e mensagens livres.',
    steps: [
      'Sempre que um cliente envia uma mensagem para o seu número, abre-se uma Janela de Sessão de 24 horas.',
      'Durante essa janela de 24h, seus atendentes podem responder livremente com qualquer mensagem de texto ou mídia.',
      'Após 24 horas sem novas mensagens do cliente, a janela expira por normas da Meta.',
      'Para reabrir o atendimento com um cliente cuja janela expirou, você deve enviar um Modelo de Mensagem (Template) aprovado.',
    ],
    tip: 'O WA-CRM exibe um contador em tempo real no topo do chat indicando o tempo restante da janela de 24h.',
  },
  {
    id: 'inbox-quick-replies',
    category: 'inbox',
    categoryLabel: 'Caixa de Entrada',
    categoryIcon: MessageSquare,
    title: 'Como usar Respostas Rápidas e Modelos (Templates) no chat',
    summary: 'Agilize o atendimento da sua equipe utilizando atalhos e modelos prontos.',
    steps: [
      'No campo de digitação do chat, digite a barra "/" para abrir o menu suspenso de respostas rápidas.',
      'Selecione a resposta desejada usando as setas do teclado e pressione Enter.',
      'Para enviar modelos oficiais (Templates), clique no ícone de Modelo (layout) ao lado do campo de texto.',
      'Escolha o modelo desejado, preencha as variáveis personalizadas (ex: {{1}} com o nome do cliente) e clique em Enviar.',
    ],
    snippet: '/ (digite a barra no campo de mensagem)',
    tip: 'Use Shift+Enter para quebrar linhas sem enviar a mensagem.',
  },
  {
    id: 'inbox-assign-agents',
    category: 'inbox',
    categoryLabel: 'Caixa de Entrada',
    categoryIcon: MessageSquare,
    title: 'Como atribuir atendentes e mudar o status da conversa',
    summary: 'Organize a distribuição de clientes entre os membros da sua equipe.',
    steps: [
      'No topo do chat ativo, clique no botão "Atribuir" ou no nome do atendente atual.',
      'Selecione o membro da equipe responsável por aquele cliente.',
      'Para organizar sua fila, altere o status da conversa no menu do topo entre "Aberto", "Pendente" ou "Fechado".',
      'Filtre a lista de conversas à esquerda pelas abas "Abertas", "Pendentes" ou "Fechadas" conforme sua rotina de trabalho.',
    ],
    tip: 'Atribuir uma conversa envia notificações visuais para o atendente responsável.',
  },

  // Contatos
  {
    id: 'contacts-csv-import',
    category: 'contacts',
    categoryLabel: 'Contatos',
    categoryIcon: Users,
    title: 'Como importar uma lista de contatos em lote via arquivo CSV',
    summary: 'Cadastre centenas de clientes de uma só vez a partir de planilhas do Excel ou Google Sheets.',
    steps: [
      'Acesse o menu Contatos e clique no botão "Importar CSV".',
      'Prepare seu arquivo CSV contendo as colunas obrigatórias: "phone" (telefone com DDD) e "name" (nome do contato).',
      'Campos opcionais recomendados: "email", "company" (empresa) e "tags" (separadas por vírgula).',
      'Selecione o arquivo no seu computador e confirme o envio.',
      'O sistema validará os telefones e inserirá os contatos automaticamente na sua base.',
    ],
    snippet: 'phone,name,email,company,tags\n5511999998888,João Silva,joao@email.com,Empresa X,VIP',
    tip: 'Certifique-se de que os números de telefone contenham o código do país (ex: 55 para o Brasil) e o DDD.',
  },
  {
    id: 'contacts-tags-notes',
    category: 'contacts',
    categoryLabel: 'Contatos',
    categoryIcon: Users,
    title: 'Como gerenciar etiquetas (Tags) e notas internas nos contatos',
    summary: 'Segmentar seus clientes e salvar informações importantes para a equipe.',
    steps: [
      'No menu Configurações → Etiquetas (Tags), crie suas categorias coloridas (ex: Cliente VIP, Prospect, Suporte).',
      'Ao visualizar um contato na Caixa de Entrada ou na tela de Contatos, você pode vincular ou remover etiquetas.',
      'Na barra lateral direita do chat, utilize o campo "Notas Internas" para registrar acordos, preferências ou observações privadas do cliente.',
    ],
    tip: 'Notas internas não são enviadas para o cliente e ficam salvas com data e horário no histórico.',
  },

  // Funil de Vendas
  {
    id: 'pipelines-kanban-deals',
    category: 'pipelines',
    categoryLabel: 'Funil de Vendas',
    categoryIcon: GitBranch,
    title: 'Como gerenciar oportunidades no Funil de Vendas (Kanban)',
    summary: 'Acompanhe suas negociações em colunas visuais e meça o valor total em aberto.',
    steps: [
      'Acesse o menu Funil de Vendas no painel lateral.',
      'Clique em "Nova Oportunidade" para cadastrar um novo negócio, definindo título, valor (R$), contato e etapa.',
      'Arraste e solte o cartão da oportunidade entre as colunas conforme a venda avança (ex: de Novo Lead para Proposta Enviada).',
      'Para cadastrar novos funis personalizados (ex: Pós-Venda ou Suporte), clique em "Novo Funil".',
    ],
    tip: 'O painel calcula automaticamente o valor total negociado em cada etapa do seu funil.',
  },

  // Disparos em Massa
  {
    id: 'broadcasts-bulk-messaging',
    category: 'broadcasts',
    categoryLabel: 'Disparos em Massa',
    categoryIcon: Radio,
    title: 'Como criar um disparo em massa seguro usando Templates aprovados',
    summary: 'Envie mensagens promocionais ou operacionais para centenas de clientes sem risco de bloqueio.',
    steps: [
      'Acesse o menu Disparos em Massa e clique em "Novo Disparo".',
      'Defina o nome da campanha e escolha o público-alvo (todos os contatos ou filtrados por Etiquetas/Tags).',
      'Selecione o Modelo de Mensagem (Template) oficial aprovado pela Meta que será enviado.',
      'Preencha os parâmetros dinâmicos se o modelo exigir (ex: nome do cliente ou código de cupom).',
      'Clique em "Enviar Disparo" e acompanhe a barra de progresso e métricas de entregues/lidos.',
    ],
    tip: 'Apenas modelos (Templates) aprovados pela Meta podem ser utilizados em disparos em massa.',
  },

  // Automações
  {
    id: 'automations-bot-triggers',
    category: 'automations',
    categoryLabel: 'Automações',
    categoryIcon: Zap,
    title: 'Como configurar robôs de atendimento automático e resposta por palavra-chave',
    summary: 'Crie fluxos No-Code que respondem clientes instantaneamente sem intervenção humana.',
    steps: [
      'Acesse o menu Automações e explore os "Modelos de início rápido".',
      'Ative a automação "Boas-vindas Automática" para saudar contatos de primeira viagem.',
      'Ative o "Fora do Expediente" para responder mensagens recebidas à noite ou fins de semana.',
      'Para criar regras customizadas, clique em "Nova Automação" e selecione o gatilho (ex: Palavra-Chave "orçamento" ou "preço").',
      'Adicione ações encadeadas: enviar mensagem, aguardar tempo, adicionar etiqueta ou atribuir a um atendente.',
    ],
    tip: 'Você pode ligar e desligar qualquer automação em 1 clique pela chave de alternância.',
  },

  // Perfil e Segurança
  {
    id: 'settings-profile-security',
    category: 'settings',
    categoryLabel: 'Perfil & Segurança',
    categoryIcon: Settings,
    title: 'Como alterar foto de perfil, senha e gerenciar sessões ativas',
    summary: 'Mantenha sua conta segura e atualize seus dados pessoais de exibição.',
    steps: [
      'Acesse o menu Configurações → aba Perfil.',
      'Envie uma foto de perfil (PNG ou JPG até 2 MB) para que sua equipe o identifique no chat.',
      'Na seção "Alterar Senha", informe sua senha atual e crie uma nova senha de no mínimo 8 caracteres.',
      'Se você perdeu um dispositivo ou deseja desconectar acessos antigos, use a opção "Sair de todos os dispositivos".',
    ],
    tip: 'Sair de todos os dispositivos invalida imediatamente todas as sessões ativas em outros computadores.',
  },
];

const CATEGORIES = [
  { id: 'all', label: 'Todos os Tópicos', icon: BookOpen },
  { id: 'whatsapp', label: 'WhatsApp & API', icon: PhoneCall },
  { id: 'inbox', label: 'Caixa de Entrada', icon: MessageSquare },
  { id: 'contacts', label: 'Contatos & CSV', icon: Users },
  { id: 'pipelines', label: 'Funil de Vendas', icon: GitBranch },
  { id: 'broadcasts', label: 'Disparos em Massa', icon: Radio },
  { id: 'automations', label: 'Automações', icon: Zap },
  { id: 'settings', label: 'Conta & Segurança', icon: ShieldCheck },
];

export default function HelpPage() {
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [expandedId, setExpandedId] = useState<string | null>('whatsapp-meta-config');
  const [copiedText, setCopiedText] = useState<string | null>(null);

  const filteredTopics = useMemo(() => {
    return HELP_TOPICS.filter((topic) => {
      const matchesCategory = activeCategory === 'all' || topic.category === activeCategory;
      const term = search.toLowerCase().trim();
      if (!term) return matchesCategory;

      const matchesSearch =
        topic.title.toLowerCase().includes(term) ||
        topic.summary.toLowerCase().includes(term) ||
        topic.categoryLabel.toLowerCase().includes(term) ||
        topic.steps.some((s) => s.toLowerCase().includes(term));

      return matchesCategory && matchesSearch;
    });
  }, [search, activeCategory]);

  const handleCopy = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedText(text);
      toast.success(`${label} copiado para a área de transferência!`);
      setTimeout(() => setCopiedText(null), 2000);
    } catch {
      toast.error('Não foi possível copiar');
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      {/* Hero Banner */}
      <div className="relative overflow-hidden rounded-2xl border border-violet-500/20 bg-gradient-to-r from-slate-900 via-violet-950/40 to-slate-900 p-6 sm:p-8 shadow-xl">
        <div className="relative z-10 space-y-3">
          <div className="inline-flex items-center gap-2 rounded-full border border-violet-500/30 bg-violet-500/10 px-3 py-1 text-xs font-semibold text-violet-300">
            <Sparkles className="size-3.5 text-violet-400" />
            Central de Conhecimento e Suporte WA-CRM
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Como podemos ajudar você hoje?
          </h1>
          <p className="text-sm sm:text-base text-slate-300 max-w-2xl">
            Encontre guias passo a passo, atalhos rápidos e solução para dúvidas frequentes sobre o seu CRM de WhatsApp.
          </p>

          {/* Search Bar */}
          <div className="pt-2 max-w-xl">
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-5 text-slate-400" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Busque por palavras-chave (ex: webhook, csv, 24h, etiquetas, automações...)"
                className="pl-11 pr-4 py-3 h-12 bg-slate-900/90 border-slate-700 text-white placeholder:text-slate-500 rounded-xl focus:border-violet-500 shadow-lg text-sm"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Category Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        {CATEGORIES.map((cat) => {
          const Icon = cat.icon;
          const isActive = activeCategory === cat.id;
          return (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={cn(
                'inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-medium whitespace-nowrap transition-all border',
                isActive
                  ? 'bg-violet-600 border-violet-500 text-white shadow-md shadow-violet-600/20'
                  : 'bg-slate-900 border-slate-800 text-slate-400 hover:bg-slate-800 hover:text-slate-200'
              )}
            >
              <Icon className="size-3.5" />
              {cat.label}
            </button>
          );
        })}
      </div>

      {/* Main Content Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Topics Accordion */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">
              Guias Práticos ({filteredTopics.length})
            </h2>
            {search && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSearch('')}
                className="text-xs text-slate-400 hover:text-white"
              >
                Limpar busca
              </Button>
            )}
          </div>

          {filteredTopics.length === 0 ? (
            <Card className="bg-slate-900 border-slate-800">
              <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                <HelpCircle className="size-10 text-slate-600 mb-3" />
                <p className="text-white font-medium text-sm">Nenhum tópico encontrado</p>
                <p className="text-slate-400 text-xs mt-1">
                  Tente buscar por termos mais genéricos como &quot;whatsapp&quot;, &quot;contato&quot; ou &quot;funil&quot;.
                </p>
              </CardContent>
            </Card>
          ) : (
            filteredTopics.map((topic) => {
              const CategoryIcon = topic.categoryIcon;
              const isExpanded = expandedId === topic.id;

              return (
                <div
                  key={topic.id}
                  className="rounded-xl border border-slate-800 bg-slate-900/60 overflow-hidden transition-colors hover:border-slate-700"
                >
                  <button
                    onClick={() => setExpandedId(isExpanded ? null : topic.id)}
                    className="w-full flex items-start justify-between gap-4 p-4 text-left transition-colors hover:bg-slate-800/40"
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-violet-500/10 text-violet-400 mt-0.5">
                        <CategoryIcon className="size-4" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge variant="outline" className="border-slate-700 text-[10px] text-slate-400">
                            {topic.categoryLabel}
                          </Badge>
                        </div>
                        <h3 className="text-sm font-semibold text-white mt-1">
                          {topic.title}
                        </h3>
                        <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">
                          {topic.summary}
                        </p>
                      </div>
                    </div>

                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-slate-400">
                      <ChevronDown
                        className={cn('size-4 transition-transform duration-200', isExpanded && 'rotate-180 text-violet-400')}
                      />
                    </div>
                  </button>

                  {isExpanded && (
                    <div className="border-t border-slate-800/80 bg-slate-950/50 p-4 space-y-4 text-xs text-slate-300">
                      <div className="space-y-2">
                        <p className="font-semibold text-slate-200">Passo a passo:</p>
                        <ol className="list-decimal list-inside space-y-1.5 text-slate-300 pl-1">
                          {topic.steps.map((step, idx) => (
                            <li key={idx} className="leading-relaxed">
                              <span className="text-slate-200">{step}</span>
                            </li>
                          ))}
                        </ol>
                      </div>

                      {topic.snippet && (
                        <div className="space-y-1.5">
                          <p className="font-semibold text-slate-400">Exemplo / Trecho de código:</p>
                          <div className="flex items-center justify-between rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 font-mono text-[11px] text-violet-300">
                            <span className="truncate pr-2">{topic.snippet}</span>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleCopy(topic.snippet!, 'Trecho')}
                              className="h-6 px-2 text-[10px] text-slate-400 hover:text-white"
                            >
                              {copiedText === topic.snippet ? (
                                <Check className="size-3 text-violet-400" />
                              ) : (
                                <Copy className="size-3" />
                              )}
                            </Button>
                          </div>
                        </div>
                      )}

                      {topic.tip && (
                        <div className="flex items-start gap-2.5 rounded-lg border border-amber-500/20 bg-amber-500/10 p-3 text-amber-300">
                          <Sparkles className="size-4 shrink-0 mt-0.5 text-amber-400" />
                          <div>
                            <span className="font-semibold">Dica Prática: </span>
                            <span>{topic.tip}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Right Column: Quick Helpers & Shortcuts */}
        <div className="space-y-6">
          {/* Quick Webhook Helper Card */}
          <Card className="bg-slate-900 border-slate-800">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold text-white flex items-center gap-2">
                <PhoneCall className="size-4 text-violet-400" />
                URL do Webhook do WhatsApp
              </CardTitle>
              <CardDescription className="text-xs text-slate-400">
                Cole este endereço no painel Meta for Developers para receber mensagens.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="rounded-lg border border-slate-800 bg-slate-950 p-2.5 font-mono text-[11px] text-slate-300 break-all">
                http://localhost:3000/api/whatsapp/webhook
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleCopy('http://localhost:3000/api/whatsapp/webhook', 'URL do Webhook')}
                className="w-full border-slate-700 text-slate-300 hover:bg-slate-800 text-xs"
              >
                <Copy className="size-3.5" />
                Copiar URL do Webhook
              </Button>
            </CardContent>
          </Card>

          {/* Keyboard Shortcuts Card */}
          <Card className="bg-slate-900 border-slate-700">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold text-white flex items-center gap-2">
                <Keyboard className="size-4 text-violet-400" />
                Atalhos Rápidos de Teclado
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2.5 text-xs">
                <li className="flex items-center justify-between">
                  <span className="text-slate-400">Menu de respostas rápidas</span>
                  <kbd className="rounded border border-slate-700 bg-slate-800 px-2 py-0.5 font-mono text-[10px] text-violet-300">
                    /
                  </kbd>
                </li>
                <li className="flex items-center justify-between">
                  <span className="text-slate-400">Enviar mensagem</span>
                  <kbd className="rounded border border-slate-700 bg-slate-800 px-2 py-0.5 font-mono text-[10px] text-violet-300">
                    Enter
                  </kbd>
                </li>
                <li className="flex items-center justify-between">
                  <span className="text-slate-400">Nova linha na mensagem</span>
                  <kbd className="rounded border border-slate-700 bg-slate-800 px-2 py-0.5 font-mono text-[10px] text-violet-300">
                    Shift + Enter
                  </kbd>
                </li>
                <li className="flex items-center justify-between">
                  <span className="text-slate-400">Fechar modais / telas</span>
                  <kbd className="rounded border border-slate-700 bg-slate-800 px-2 py-0.5 font-mono text-[10px] text-violet-300">
                    Esc
                  </kbd>
                </li>
              </ul>
            </CardContent>
          </Card>

          {/* Useful Resource Links */}
          <Card className="bg-slate-900/60 border-slate-800">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold text-white flex items-center gap-2">
                <ExternalLink className="size-4 text-violet-400" />
                Links Úteis da Meta
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-xs">
              <a
                href="https://developers.facebook.com"
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-between rounded-lg p-2 text-slate-300 hover:bg-slate-800 hover:text-white transition-colors"
              >
                <span>Meta for Developers</span>
                <ExternalLink className="size-3 text-slate-500" />
              </a>
              <a
                href="https://business.facebook.com"
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-between rounded-lg p-2 text-slate-300 hover:bg-slate-800 hover:text-white transition-colors"
              >
                <span>Gerenciador de Negócios Meta</span>
                <ExternalLink className="size-3 text-slate-500" />
              </a>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
