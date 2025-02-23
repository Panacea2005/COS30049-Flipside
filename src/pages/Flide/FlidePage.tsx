import React, { useState, useEffect, useRef } from "react";
import { ethers } from "ethers";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card } from "@/components/ui/card";
import {
  Search,
  SendHorizontal,
  Bot,
  User,
  Plus,
  Clock,
  Menu,
  Paperclip,
  Trash,
  Pin,
  MoreVertical,
  File,
} from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { chatService, Message } from "./components/chatService";
import { chatStore, ChatHistory } from "./components/chatStore";
import { contractAnalyzer } from "./components/contractAnalyzer";
import { toast } from "@/hooks/use-toast";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  ConnectButton,
  useCurrentAccount,
  useDisconnectWallet,
} from "@mysten/dapp-kit"; // Sui wallet integration

export const FlidePage = () => {
  // Chat & file upload state
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [currentChatId, setCurrentChatId] = useState<number | null>(null);
  const [chatHistory, setChatHistory] = useState<ChatHistory[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [showInitialMessage, setShowInitialMessage] = useState(true);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [uploadedFileContent, setUploadedFileContent] = useState<string | null>(null);
  const [selectedModel, setSelectedModel] = useState("deepseek-r1-distill-llama-70b");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  // Sui wallet
  const account = useCurrentAccount();
  const disconnect = useDisconnectWallet();

  // MetaMask wallet state
  const [metaAccount, setMetaAccount] = useState<string>("");
  const [metaConnected, setMetaConnected] = useState<boolean>(false);
  const [metaProvider, setMetaProvider] = useState<ethers.BrowserProvider | null>(null);

  const connectMetaMask = async () => {
    if (window.ethereum) {
      try {
        const provider = new ethers.BrowserProvider(window.ethereum);
        setMetaProvider(provider);
        await window.ethereum.request({ method: "eth_requestAccounts" });
        const signer = await provider.getSigner();
        const address = await signer.getAddress();
        setMetaAccount(address);
        setMetaConnected(true);
      } catch (error) {
        console.error("MetaMask connection error:", error);
        toast({
          title: "MetaMask Connection Error",
          description: (error as Error).message,
          variant: "destructive",
        });
      }
    } else {
      toast({
        title: "MetaMask Not Installed",
        description: "Please install MetaMask to connect.",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    // Load chat history on component mount
    const history = chatStore.getChatHistory().map((chat) => ({
      ...chat,
      title: chatStore.generateChatTitle(chat.messages),
    }));
    setChatHistory(history);
  }, []);

  useEffect(() => {
    // Scroll to the bottom when messages change
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if ((!input.trim() && !uploadedFile) || isLoading) return;

    try {
      setIsLoading(true);
      const userMessage: Message = {
        role: "user",
        content: input + (uploadedFile ? `\n\nFile: ${uploadedFile.name}` : ""),
      };
      setMessages((prev) => [...prev, userMessage]);
      setInput("");
      setUploadedFile(null);

      // Show bot thinking animation
      setMessages((prev) => [...prev, { role: "assistant", content: "..." }]);

      let response = "";
      const containsCode = chatService.detectMoveCode(input);
      const codeContent = uploadedFileContent || input;

      if (containsCode || uploadedFileContent) {
        const analysis = await contractAnalyzer.analyzeContract(codeContent, selectedModel);

        // Format the analysis results with improved styling
        response = `CONTRACT SECURITY ANALYSIS

OVERVIEW
1. Security Score: ${analysis.securityScore}/100
2. Scan Duration: ${analysis.scanDuration}
3. Lines of Code: ${analysis.linesOfCode}
4. Total Issues: ${analysis.issuesCount}

CRITICAL ISSUES ${analysis.critical.length > 0 ? "" : "None"}
${
  analysis.critical.length === 0
    ? ""
    : analysis.critical
        .map(
          (issue) => `
- ${issue.type}
  - Description: ${issue.description}
  - Impact: ${issue.impact}
  - Location: ${issue.location || "N/A"}
  - Recommendation: ${issue.recommendation}
`
        )
        .join("\n")
}

HIGH SEVERITY ISSUES ${analysis.high.length > 0 ? "" : "None"}
${
  analysis.high.length === 0
    ? ""
    : analysis.high
        .map(
          (issue) => `
- ${issue.type}
  - Description: ${issue.description}
  - Impact: ${issue.impact}
  - Location: ${issue.location || "N/A"}
  - Recommendation: ${issue.recommendation}
`
        )
        .join("\n")
}

MEDIUM SEVERITY ISSUES ${analysis.medium.length > 0 ? "" : "None"}
${
  analysis.medium.length === 0
    ? ""
    : analysis.medium
        .map(
          (issue) => `
- ${issue.type}
  - Description: ${issue.description}
  - Impact: ${issue.impact}
  - Location: ${issue.location || "N/A"}
  - Recommendation: ${issue.recommendation}
`
        )
        .join("\n")
}

LOW SEVERITY ISSUES ${analysis.low.length > 0 ? "" : "None"}
${
  analysis.low.length === 0
    ? ""
    : analysis.low
        .map(
          (issue) => `
- ${issue.type}
  - Description: ${issue.description}
  - Impact: ${issue.impact}
  - Location: ${issue.location || "N/A"}
  - Recommendation: ${issue.recommendation}
`
        )
        .join("\n")
}

INFORMATIONAL WARNINGS ${analysis.informational.length > 0 ? "" : "None"}
${
  analysis.informational.length === 0
    ? ""
    : analysis.informational
        .map(
          (issue) => `
- ${issue.type}
  - Description: ${issue.description}
  - Impact: ${issue.impact}
  - Location: ${issue.location || "N/A"}
  - Recommendation: ${issue.recommendation}
`
        )
        .join("\n")
}

OPTIMIZATION SUGGESTIONS ${analysis.optimizations.length > 0 ? "" : "None"}
${
  analysis.optimizations.length === 0
    ? ""
    : analysis.optimizations
        .map(
          (opt) => `
- ${opt.type}
  - Description: ${opt.description}
  - Suggestion: ${opt.suggestion}
  - Impact: ${opt.impact}
`
        )
        .join("\n")
}`;

        console.log("Analysis response:", response);
        setUploadedFileContent(null);
      } else {
        response = await chatService.sendMessage([userMessage], selectedModel);
      }

      // Gradually display the bot's response
      let displayedResponse = "";
      const words = response.split(" ");
      for (let i = 0; i < words.length; i++) {
        displayedResponse += words[i] + " ";
        setMessages((prev) =>
          prev.slice(0, -1).concat({ role: "assistant", content: displayedResponse })
        );
        if (scrollAreaRef.current) {
          scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
        }
        await new Promise((resolve) => setTimeout(resolve, 50));
      }

      if (!currentChatId) {
        const newChat: ChatHistory = {
          id: Date.now(),
          title: chatStore.generateChatTitle([...messages, userMessage]),
          date: new Date().toISOString().split("T")[0],
          messages: [...messages, userMessage],
        };
        chatStore.saveChat(newChat);
        setCurrentChatId(newChat.id);
        setChatHistory((prev) => [...prev, newChat]);
      } else {
        chatStore.updateChat(currentChatId, messages);
      }

      setShowInitialMessage(false);
    } catch (error) {
      console.error("Error in handleSend:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to send message.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setUploadedFile(file);
      const fileContent = await file.text();
      setUploadedFileContent(fileContent);
    }
  };

  const handleLoadChat = (chatId: number) => {
    const chat = chatStore.loadChat(chatId);
    if (chat) {
      setMessages(chat.messages);
      setCurrentChatId(chat.id);
    }
  };

  const handleDeleteChat = (chatId: number) => {
    chatStore.deleteChat(chatId);
    setChatHistory(chatStore.getChatHistory());
    if (currentChatId === chatId) {
      setMessages([]);
      setShowInitialMessage(true);
      setCurrentChatId(null);
    }
  };

  const handlePinChat = (chatId: number) => {
    chatStore.pinChat(chatId);
    setChatHistory(chatStore.getChatHistory());
  };

  const handleNewChat = () => {
    setMessages([]);
    setShowInitialMessage(true);
    setCurrentChatId(null);
  };

  const filteredHistory = chatHistory.filter((chat) =>
    chat.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const sortedHistory = [...filteredHistory].sort(
    (a, b) => (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0)
  );

  const Sidebar = () => (
    <div className="w-full h-full flex flex-col">
      <div className="p-4">
        <Button variant="outline" className="w-full justify-start gap-2" onClick={handleNewChat}>
          <Plus className="w-4 h-4" />
          New Chat
        </Button>
      </div>
      <div className="p-4">
        <div className="relative">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search chats..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8"
          />
        </div>
      </div>
      <ScrollArea className="flex-1 px-4">
        <div className="space-y-2">
          {sortedHistory.map((chat) => (
            <div key={chat.id} className="flex justify-between items-center">
              <Button
                variant="ghost"
                className="w-full justify-start gap-2 text-left"
                onClick={() => handleLoadChat(chat.id)}
              >
                <Clock className="w-4 h-4" />
                <div className="flex-1 truncate">
                  <div className="text-sm">{chat.title}</div>
                  <div className="text-xs text-muted-foreground">{chat.date}</div>
                </div>
              </Button>
              <div className="flex gap-2">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <MoreVertical className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuItem onClick={() => handlePinChat(chat.id)}>
                      <Pin
                        className={`w-4 h-4 mr-2 ${chat.pinned ? "text-yellow-500" : "text-muted-foreground"}`}
                      />
                      {chat.pinned ? "Unpin" : "Pin"}
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleDeleteChat(chat.id)}>
                      <Trash className="w-4 h-4 mr-2 text-red-500" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>
      {/* Wallet Connection Area */}
      <div className="p-4 border-t space-y-4">
        {/* Sui Wallet Section */}
        <div>
          <h3 className="text-sm font-bold mb-1">Sui Wallet</h3>
          {!account ? (
            <ConnectButton />
          ) : (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <div className="flex items-center gap-2 p-2 rounded-lg hover:bg-accent cursor-pointer">
                  <img src="/sui.svg" alt="Sui Wallet" width="16" height="16" />
                  <div className="flex-1 truncate">
                    <div className="text-sm font-medium">
                      {`${account.address.slice(0, 6)}...${account.address.slice(-4)}`}
                    </div>
                  </div>
                </div>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => disconnect.mutate()}>
                  <div className="flex items-center gap-2">
                    {/* SVG icon omitted for brevity */}
                    Disconnect
                  </div>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
        {/* MetaMask Section */}
        <div>
          <h3 className="text-sm font-bold mb-1">MetaMask</h3>
          {!metaConnected ? (
            <Button onClick={connectMetaMask} className="w-full">
              Connect MetaMask
            </Button>
          ) : (
            <div className="flex items-center gap-2">
              <img
                src={`/metamask.svg`}
                alt="MetaMask Avatar"
                className="w-6 h-6 rounded-full"
              />
              <div className="text-sm font-medium">{`${metaAccount.slice(0, 6)}...${metaAccount.slice(-4)}`}</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  const renderAssistantMessage = (content: string) => {
    const paragraphs = content.split("\n\n");
    return paragraphs.map((paragraph, index) => (
      <p key={index} className="assistant-message-paragraph">
        {paragraph.split(" ").map((word, wordIndex) => (
          <span key={wordIndex} className="assistant-message-word">
            {word}{" "}
          </span>
        ))}
      </p>
    ));
  };

  return (
    <div className="flex h-[calc(100vh)] pt-16">
      {/* Desktop Sidebar */}
      <div className="hidden md:flex w-64 border-r bg-background">
        <Sidebar />
      </div>

      {/* Mobile Sidebar */}
      <Sheet>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon" className="md:hidden absolute left-4 top-4">
            <Menu className="h-4 w-4" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-64 p-0">
          <Sidebar />
        </SheetContent>
      </Sheet>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        <div className="p-4 flex justify-between items-center">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <div className="flex items-center gap-2 cursor-pointer">
                <span>Model: {selectedModel}</span>
                <Menu className="h-4 w-4" />
              </div>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => setSelectedModel("deepseek-r1-distill-llama-70b")}>
                deepseek-r1-distill-llama-70b
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSelectedModel("llama-3.3-70b-versatile")}>
                llama-3.3-70b-versatile
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSelectedModel("mixtral-8x7b-32768")}>
                mixtral-8x7b-32768
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        {showInitialMessage && (
          <div className="flex-1 flex items-center justify-center">
            <h1 className="text-4xl font-bold text-center animate-pulse">
              What can I help you with your Move smart contracts today?
            </h1>
          </div>
        )}
        <ScrollArea
          ref={scrollAreaRef}
          className={`flex-1 px-4 py-4 ${showInitialMessage ? "hidden" : "block"}`}
        >
          <div className="space-y-4 max-w-3xl mx-auto">
            {messages.map((message, index) => (
              <div
                key={index}
                className={`flex gap-3 ${message.role === "assistant" ? "justify-start" : "justify-end"}`}
              >
                {message.role === "assistant" && (
                  <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 bg-gradient-to-r from-pink-500 to-blue-500">
                    <Bot className="w-5 h-5 text-white" />
                  </div>
                )}
                {message.role === "assistant" ? (
                  <div className="assistant-message-container">{renderAssistantMessage(message.content)}</div>
                ) : (
                  <Card className={`p-4 max-w-[85%] ${message.role === "system" ? "bg-muted text-left" : "bg-primary text-primary-foreground text-right"}`}>
                    {message.content === "..." ? (
                      <div className="flex items-center">
                        <div className="thinking-dots"></div>
                        <div className="thinking-dots"></div>
                        <div className="thinking-dots"></div>
                      </div>
                    ) : (
                      <div>{message.content}</div>
                    )}
                  </Card>
                )}
                {message.role === "user" && (
                  <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 bg-gradient-to-r from-blue-500 to-sky-300">
                    <User className="w-5 h-5 text-white" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </ScrollArea>

        <div className="p-4 bg-background flex flex-col gap-2">
          {uploadedFile && (
            <Card className="p-4 flex items-center gap-2">
              <File className="w-5 h-5" />
              <span>{uploadedFile.name}</span>
            </Card>
          )}
          <div className="flex gap-2">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type your message..."
              className="flex-1"
            />
            <label className="flex items-center">
              <Button size="icon" onClick={() => fileInputRef.current?.click()}>
                <Paperclip className="w-4 h-4" />
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".move"
                className="hidden"
                onChange={handleFileUpload}
              />
            </label>
            <Button onClick={handleSend} size="icon">
              <SendHorizontal className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Add CSS for the thinking animation and assistant message styling
const styles = `
@keyframes thinking {
  0%, 80%, 100% { transform: translateY(0); }
  40% { transform: translateY(-5px); }
}
.thinking-dots {
  display: inline-block;
  width: 6px;
  height: 6px;
  margin: 0 2px;
  background-color: #000;
  border-radius: 50%;
  animation: thinking 1.4s infinite ease-in-out both;
}
.thinking-dots:nth-child(1) { animation-delay: -0.32s; }
.thinking-dots:nth-child(2) { animation-delay: -0.16s; }
.thinking-dots:nth-child(3) { animation-delay: 0s; }
.assistant-message-container { display: flex; flex-direction: column; gap: 1rem; }
.assistant-message-paragraph { display: flex; flex-wrap: wrap; gap: 0.25rem; }
.assistant-message-word { opacity: 0; animation: fadeIn 0.05s forwards; }
@keyframes fadeIn { to { opacity: 1; } }
`;
document.head.insertAdjacentHTML("beforeend", `<style>${styles}</style>`);
