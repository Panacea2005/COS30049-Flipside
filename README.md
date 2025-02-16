Flipside Blockchain Transaction Visualization System
📊 Explore blockchain transactions with interactive visualization, AI insights, and real-time analytics.


🚀 Live Demo
🔗 Website: Flipside Web Application
🔗 Figma UI Design: Flipside UI/UX Wireframes
🔗 Figma Prototype: Flipside Clickable Prototype
🔗 API Documentation: Flipside API Docs

📖 Table of Contents
About the Project
Key Features
Tech Stack
Installation
Usage
Test Account
Contributing
License
Contact
📌 About the Project
The Flipside Blockchain Transaction Visualization System is a powerful, interactive platform that enables users to explore blockchain transactions through graph-based visualization, AI-driven insights, and real-time tracking.

This system is built with React.js, Next.js, Neo4j, and Supabase to provide a scalable, user-friendly experience for blockchain analysts, security researchers, traders, and developers.

✨ Key Features
✔ Wallet Search & Retrieval – Enter any wallet address to fetch blockchain transaction data.
✔ Graph-Based Transaction Visualization – Interactive graphs powered by D3.js for multi-hop transaction tracking.
✔ AI-Powered Analysis (Flide AI) – Smart contract security assessment and blockchain transaction insights.
✔ User Authentication & Profile Management – Secure login and account customization with Supabase Auth.
✔ Wallet Connectivity – Connect and analyze Sui Wallet transactions in real-time.
✔ Multi-Chain Support (Upcoming) – Future integration for Ethereum, Solana, and Avalanche blockchains.

🛠️ Tech Stack
Category	Technology
Frontend	React.js, Next.js, Tailwind CSS, Vite.js
Backend	Node.js, Express.js, TypeScript
Database	Neo4j (Graph DB), Supabase (Auth & Storage)
Blockchain API	Web3.js, Etherscan API, Sui.js SDK
AI & Analytics	Groq API, Flide AI
Deployment	Netlify (Frontend), Vercel, Supabase Hosting
📥 Installation
1️⃣ Clone the Repository
bash
Copy
Edit
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
Click “Connect Wallet” to link your Sui Wallet and analyze real-time transactions.
4. View Transactions in Tabular Format
The dashboard displays all transactions with filtering options for dates, amounts, and wallet activity.
🔑 Test Account
Use the following credentials to log in and test the system:

plaintext
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

