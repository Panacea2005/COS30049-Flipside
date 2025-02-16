# 🚀 Flipside Blockchain Transaction Visualization System

📊 **Explore blockchain transactions with interactive visualization, AI insights, and real-time analytics.**  

![Flipside Preview](your-image-link-here)

## 🔗 Live Demo & Project Links
- **🌐 Live Deployment:** [Flipside Web Application](your-deployed-web-link-here)
- **🎨 Figma UI Design:** [Flipside UI/UX Wireframes](your-figma-design-link-here)
- **🖥️ Figma Interactive Prototype:** [Flipside Clickable Prototype](your-figma-prototype-link-here)
- **💻 GitHub Repository:** [Source Code & Documentation](your-github-repo-link-here)
- **📄 API Documentation (if applicable):** [Flipside API Docs](your-api-docs-link-here)

---

## 📖 Table of Contents
- [About the Project](#about-the-project)
- [Key Features](#key-features)
- [Tech Stack](#tech-stack)
- [Installation](#installation)
- [Usage](#usage)
- [Test Account](#test-account)
- [Contributing](#contributing)
- [License](#license)
- [Contact](#contact)

---

## 📌 About the Project
The **Flipside Blockchain Transaction Visualization System** is an **interactive platform** that enables users to **explore blockchain transactions** through **graph-based visualization, AI insights, and real-time tracking**.

This system is built with **React.js, Next.js, Neo4j, and Supabase**, providing a **scalable and user-friendly experience** for blockchain analysts, security researchers, traders, and developers.

---

## ✨ Key Features
✔ **Wallet Search & Retrieval** – Search for wallet addresses to retrieve transaction history.  
✔ **Graph-Based Visualization** – Interactive **D3.js-powered** transaction flow visualization.  
✔ **AI-Powered Analysis (Flide AI)** – Smart contract security and transaction insights.  
✔ **User Authentication & Profile Management** – Secure login with **Supabase Auth**.  
✔ **Wallet Connectivity** – Connect and analyze **Sui Wallet transactions**.  
✔ **Multi-Chain Support (Upcoming)** – Future integration for **Ethereum, Solana, Avalanche**.  

---

## 🛠️ Tech Stack

| **Category**       | **Technology** |
|--------------------|--------------|
| **Frontend**      | React.js, Next.js, Tailwind CSS, Vite.js |
| **Backend**       | Node.js, Express.js, TypeScript |
| **Database**      | Neo4j (Graph DB), Supabase (Auth & Storage) |
| **Blockchain API** | Web3.js, Etherscan API, Sui.js SDK |
| **AI & Analytics** | Groq API, Flide AI |
| **Deployment**    | Netlify (Frontend), Vercel, Supabase Hosting |

---

## 📥 Installation

### 1️⃣ Clone the Repository
```bash
git clone https://github.com/your-github-repo/flipside.git
cd flipside
2️⃣ Install Dependencies
bash
Copy
Edit
npm install
3️⃣ Set Up Environment Variables
Create a .env file in the root directory and add the following:

env
Copy
Edit
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
NEXT_PUBLIC_NEO4J_URI=your-neo4j-uri
NEXT_PUBLIC_NEO4J_USER=your-neo4j-user
NEXT_PUBLIC_NEO4J_PASSWORD=your-neo4j-password
NEXT_PUBLIC_ETHERSCAN_API_KEY=your-etherscan-api-key
NEXT_PUBLIC_SUI_WALLET_API=your-sui-wallet-api
NEXT_PUBLIC_GROQ_API_KEY=your-groq-api-key
4️⃣ Start the Development Server
bash
Copy
Edit
npm run dev
Open http://localhost:3000/ in your browser to view the app.

🖥️ Usage
1. Search for a Wallet Address
Enter a wallet address in the search bar to retrieve transaction history.
Transactions are displayed in graph-based visualization with multi-hop tracing.
2. Explore AI-Powered Insights
Click on Flide AI to get contract security analysis and AI-driven insights on wallet activity.
3. Connect Your Sui Wallet
Click "Connect Wallet" to link your Sui Wallet and analyze real-time transactions.
4. View Transactions in Tabular Format
The dashboard displays all transactions with filtering options for dates, amounts, and wallet activity.
🔑 Test Account
Use the following credentials to log in and test the system:

yaml
Copy
Edit
📧 Email: testuser@flipside.com
🔑 Password: FlipsideTest123!
Note: This is a demo account with limited access. Some advanced features (wallet connection, contract deployment) may be disabled.

👨‍💻 Contributing
We welcome contributions! 🚀

How to Contribute?
Fork the repository
Create a new branch (feature/new-feature)
Commit changes (git commit -m "Add new feature")
Push to GitHub (git push origin feature/new-feature)
Open a Pull Request 🎉
📜 License
This project is licensed under the MIT License. See the LICENSE file for more details.

📩 Contact
For support, questions, or feedback:
📧 Email: your-email@flipside.com
🐙 GitHub Issues: Report an Issue
