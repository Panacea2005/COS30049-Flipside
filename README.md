# Flipside Blockchain Transaction Visualization System

An advanced platform for exploring blockchain transactions through interactive visualizations, AI-powered insights, and real-time analytics.

## Overview

Flipside is a comprehensive blockchain analytics platform that combines graph-based visualization with artificial intelligence to provide deep insights into blockchain transactions. Built with modern web technologies and powered by robust backend infrastructure, it offers a seamless experience for blockchain analysts, researchers, and developers.

## Key Features

- **Interactive Transaction Visualization**: Explore transaction flows through D3.js-powered graph visualizations
- **AI-Powered Analytics (Flide AI)**: Get intelligent insights into smart contract security and transaction patterns
- **Multi-Chain Support**: Analysis capabilities for multiple blockchain networks (Ethereum, Solana, Avalanche - coming soon)
- **Secure Authentication**: Built-in user management and profile system powered by Supabase
- **Wallet Integration**: Direct connection with Sui Wallet for real-time transaction analysis
- **Advanced Search**: Robust wallet address search and transaction history retrieval

## Technology Stack

### Frontend
- React.js with Next.js for robust UI rendering
- Tailwind CSS for responsive design
- Vite.js for optimized development experience

### Backend
- Node.js/Express.js with TypeScript
- Neo4j for graph database operations
- Supabase for authentication and storage

### Blockchain Integration
- Web3.js for blockchain interaction
- Etherscan API integration
- Sui.js SDK for Sui blockchain support

### AI & Analytics
- Groq API for advanced analytics
- Custom Flide AI implementation

## Getting Started

### Prerequisites
- Node.js (v18 or higher)
- npm or yarn
- Git

### Installation

1. Clone the repository:
```bash
git clone https://github.com/your-username/flipside.git
cd flipside
```

2. Install dependencies:
```bash
npm install
```

3. Configure environment variables:
Create a `.env` file in the root directory with the following variables:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
NEXT_PUBLIC_NEO4J_URI=your_neo4j_uri
NEXT_PUBLIC_NEO4J_USER=your_neo4j_user
NEXT_PUBLIC_NEO4J_PASSWORD=your_neo4j_password
NEXT_PUBLIC_ETHERSCAN_API_KEY=your_etherscan_api_key
NEXT_PUBLIC_SUI_WALLET_API=your_sui_wallet_api
NEXT_PUBLIC_GROQ_API_KEY=your_groq_api_key
```

4. Start the development server:
```bash
npm run dev
```

Visit `http://localhost:3000` to view the application.

## Demo Access

Test the platform using our demo account:
- Email: ng.t.thien01@gmail.com
- Password: 10082005

Note: Demo accounts have limited access to certain features.

## Project Links

- [Live Application](https://flipsidecrypto.netlify.app)
- [UI/UX Wireframes](https://www.figma.com/design/y9tMd5JwtFGaeYGNZr4Cn4/Flipside-Prototype-Design)
- [Interactive Prototype](https://www.figma.com/proto/y9tMd5JwtFGaeYGNZr4Cn4/Flipside-Prototype-Design)

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Contact

- Project Team: dev@flipside.com
- Issue Tracker: [GitHub Issues](https://github.com/your-username/flipside/issues)

## Acknowledgments

- [D3.js](https://d3js.org/) for visualization capabilities
- [Supabase](https://supabase.com/) for backend infrastructure
- [Neo4j](https://neo4j.com/) for graph database solutions
