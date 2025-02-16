import { motion } from "framer-motion";

export const StudioSection = () => {
  return (
    <section style={{ padding: "4rem 1rem", textAlign: "center" }}>
      <h2
        style={{
          fontSize: "2.5rem",
          fontWeight: "300",
          marginBottom: "4rem",
          lineHeight: "1.2",
        }}
      >
        DATA STARTS
        <br />
        IN THE
        <br />
        <span
          style={{
            background: "linear-gradient(to right, #a855f7, #ec4899, #3b82f6)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
          }}
        >
          STUDIO
        </span>
      </h2>

      {/* About Studio */}
      <div style={{ maxWidth: "800px", margin: "0 auto 3rem" }}>
        <span style={{ color: "#7C3AED", fontSize: "0.9rem" }}>About Studio</span>
        <p style={{ fontSize: "1.25rem", marginTop: "1rem" }}>
          Unlock blockchain intelligence with our three core features:
        </p>
      </div>

      {/* Cards Container */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
          gap: "2rem",
          justifyContent: "center",
          maxWidth: "80rem",
          margin: "0 auto",
        }}
      >
        {/* Overview Statistics Dashboard */}
        <motion.div
          style={{
            backgroundColor: "#F9FAFB",
            borderRadius: "1rem",
            padding: "2rem",
            textAlign: "left",
          }}
          initial={{ opacity: 0, x: -50 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: false, amount: 0.5 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        >
          <code style={{ color: "#EC4899", fontSize: "1rem" }}>Overview Statistics Dashboard</code>
          <div style={{ borderRadius: "0.5rem", overflow: "hidden", marginTop: "1rem" }}>
            <img src="./overview.png" alt="Overview Statistics Dashboard" style={{ width: "100%" }} />
          </div>
          <div style={{ marginTop: "1rem" }}>
            <div style={{ fontSize: "0.875rem", color: "#6B7280", marginBottom: "0.5rem" }}>Overview Tab</div>
            <p style={{ fontSize: "1.125rem", color: "#111827" }}>
              Get a high-level view of blockchain activity, including contract interactions, gas usage, and top addresses.
            </p>
          </div>
        </motion.div>

        {/* Address Statistics & Graphs */}
        <motion.div
          style={{
            backgroundColor: "#F9FAFB",
            borderRadius: "1rem",
            padding: "2rem",
            textAlign: "left",
          }}
          initial={{ opacity: 0, x: 50 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: false, amount: 0.5 }}
          transition={{ duration: 0.6, ease: "easeOut", delay: 0.2 }}
        >
          <code style={{ color: "#EC4899", fontSize: "1rem" }}>Address Statistics & Graphs</code>
          <div style={{ borderRadius: "0.5rem", overflow: "hidden", marginTop: "1rem" }}>
            <img src="./visualization.png" alt="Visualization" style={{ width: "100%" }} />
          </div>
          <div style={{ marginTop: "1rem" }}>
            <div style={{ fontSize: "0.875rem", color: "#6B7280", marginBottom: "0.5rem" }}>Visualization Tab</div>
            <p style={{ fontSize: "1.125rem", color: "#111827" }}>
              Search any wallet address to generate a graph-based visualization of on-chain transactions.
            </p>
          </div>
        </motion.div>
      </div>

      {/* Full Transaction History (Appears from Bottom) */}
      <motion.div
        style={{
          backgroundColor: "#F9FAFB",
          borderRadius: "1rem",
          padding: "2rem",
          marginTop: "2rem",
          maxWidth: "50rem",
          marginLeft: "auto",
          marginRight: "auto",
          textAlign: "left",
        }}
        initial={{ opacity: 0, y: 50 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: false, amount: 0.5 }}
        transition={{ duration: 0.6, ease: "easeOut", delay: 0.4 }}
      >
        <code style={{ color: "#EC4899", fontSize: "1rem" }}>Full Transaction History</code>
        <div style={{ borderRadius: "0.5rem", overflow: "hidden", marginTop: "1rem" }}>
          <img src="./transaction.png" alt="Transaction History" style={{ width: "100%" }} />
        </div>
        <div style={{ marginTop: "1rem" }}>
          <div style={{ fontSize: "0.875rem", color: "#6B7280", marginBottom: "0.5rem" }}>Transaction Tab</div>
          <p style={{ fontSize: "1.125rem", color: "#111827" }}>
            Explore detailed transaction logs, including timestamps, amounts, and counterparties, to track fund movements.
          </p>
        </div>
      </motion.div>

      {/* CTA Button */}
      <motion.div
        whileHover={{ x: 5 }}
      >
        <a
          href="/studio"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "0.5rem",
            backgroundColor: "black",
            color: "white",
            padding: "1rem 2rem",
            borderRadius: "0.5rem",
            fontSize: "1.125rem",
            textDecoration: "none",
            cursor: "pointer",
            transition: "background 0.3s",
          }}
        >
          <span>Enter Studio</span>
          <span style={{ transition: "transform 0.2s" }}>→</span>
        </a>
      </motion.div>
    </section>
  );
};
