// Content for the "About me" tab. Everything here comes from the resume and notes in /data.
// Edit this file to change what the tab shows. Keep it in step with data\resume.txt and faq.txt.

export const profile = {
  name: "Rangam Jagadesh",
  nickname: "Jashu",
  headline: "Backend developer in the making · Python · Distributed systems · AI",

  summary:
    "I'm a Computer Science student specializing in Artificial Intelligence, and I focus on backend development with Python, Django and FastAPI. I learn by building: instead of only studying theory, I try to understand how systems work internally and implement them from scratch, from distributed databases to search engines and AI-powered apps.",

  // Shown as quick-start chips. Each one is asked in the chat when tapped.
  starters: ["Tell me about yourself.", "What are your main technical skills?", "Why should we hire you?"],

  // number counts up on screen; text is shown as is
  facts: [
    { value: 9.21, decimals: 2, label: "B.Tech CGPA" },
    { value: 9, label: "Projects built" },
    { value: 6, label: "Certifications" },
    { text: "2027", label: "Graduating" },
  ],

  education: [
    {
      when: "2024 – 2027",
      what: "B.Tech, Computer Science and Engineering (AI)",
      detail: "Vemu Institute of Technology, Andhra Pradesh · Lateral entry · CGPA 9.21",
    },
    {
      when: "2021 – 2024",
      what: "Diploma, Computer Science and Engineering",
      detail: "Priyadharshini Institute of Technology and Management · 85.94%",
    },
    {
      when: "Schooling",
      what: "Boys Town English Medium High School",
      detail: "",
    },
  ],

  skills: [
    { group: "Languages", items: ["Python", "SQL"] },
    { group: "Backend", items: ["Django", "FastAPI", "REST APIs"] },
    { group: "Databases", items: ["PostgreSQL", "Redis", "Elasticsearch"] },
    {
      group: "Computer science",
      items: ["Data structures and algorithms", "DBMS", "OOP", "System design", "Distributed systems"],
    },
    { group: "Tools", items: ["Git", "GitHub", "Docker"] },
    { group: "AI", items: ["Generative AI", "LLM applications", "AI workflows", "Prompt engineering"] },
  ],

  projects: [
    {
      name: "Distributed Key-Value Store",
      category: "Distributed systems",
      summary:
        "A distributed key-value database built on the Raft consensus algorithm, with leader election, heartbeats, log replication, snapshots and recovery.",
      tech: ["Python", "FastAPI", "Raft"],
      ask: "Tell me about your Distributed Key-Value Store project",
    },
    {
      name: "MyRedis Clone",
      category: "Distributed systems",
      summary:
        "A Redis-inspired in-memory database with AOF persistence, Pub/Sub, transactions, sharding, replication and leader election.",
      tech: ["Python", "Distributed systems"],
      ask: "Tell me about your MyRedis Clone project",
    },
    {
      name: "Smart Load Balancer",
      category: "Distributed systems",
      summary:
        "A custom Round Robin load balancer with backend health monitoring and real-time metrics.",
      tech: ["Python"],
      ask: "Tell me about your Smart Load Balancer project",
    },
    {
      name: "SearchX",
      category: "Backend",
      summary:
        "A production-style search engine backend with full-text search, autocomplete, BM25 ranking, recommendations, analytics and caching.",
      tech: ["Python", "FastAPI", "Elasticsearch", "PostgreSQL", "Redis", "Docker"],
      ask: "Tell me about your SearchX project",
    },
    {
      name: "Webhook Payment Simulator",
      category: "Backend",
      summary:
        "Two apps, FakePay and MyShop, that show how payment webhooks are signed and verified with HMAC-SHA256.",
      tech: ["FastAPI", "HMAC-SHA256"],
      ask: "Tell me about your Webhook Payment Simulator",
    },
    {
      name: "TripMate AI",
      category: "AI",
      summary:
        "A multi-agent travel planner that coordinates flight suggestions, hotel recommendations and itineraries.",
      tech: ["Python", "FastAPI", "LangGraph", "LangChain", "Groq", "PostgreSQL"],
      ask: "Tell me about your TripMate AI project",
    },
    {
      name: "CI/CD TestFlow",
      category: "DevOps",
      summary:
        "A project on automated testing and continuous integration, using pytest, Docker and GitHub Actions.",
      tech: ["FastAPI", "React", "Docker", "GitHub Actions", "pytest"],
      ask: "Tell me about your CI/CD TestFlow project",
    },
    {
      name: "Hand Cricket Game",
      category: "Fundamentals",
      summary: "A console Hand Cricket game with score tracking and game logic.",
      tech: ["Python", "OOP"],
      ask: "Tell me about your Hand Cricket Game",
    },
    {
      name: "Ticket Booking Representation",
      category: "Fundamentals",
      summary: "A desktop ticket-booking representation built with Python's Tkinter.",
      tech: ["Python", "Tkinter"],
      ask: "Tell me about your Ticket Booking project",
    },
  ],

  exploring: {
    items: ["RAG", "LangChain", "LangGraph", "LLM architectures", "Embeddings", "Vector databases", "AI agents"],
    ask: "Are you currently exploring any new AI technologies?",
  },

  approach: [
    {
      title: "Learn by building",
      text: "Practical projects over theory alone. I'd rather make the thing than only read about it.",
    },
    {
      title: "Understand the internals",
      text: "Wherever possible I implement systems from scratch to see how they really work.",
    },
    {
      title: "Tell the whole story",
      text: "When I explain a project I cover the problem, my approach, the tech, the challenges and what I learned.",
    },
  ],

  certifications: [
    "Machine Learning Using Python · ServiceNow University Program",
    "Crash Course on Python · Google",
    "Prompt Engineering · APSSDC",
    "Blockchain · APSSDC",
    "Generative AI, 15-day program · BKIT Solutions",
    "Prompt Engineering lecture · Mentorly",
  ],

  links: [
    { label: "GitHub", href: "https://github.com/RANGAM-JAGADESH" },
    { label: "LinkedIn", href: "https://www.linkedin.com/in/rangam-jagadesh-b88b42358" },
  ],
};
