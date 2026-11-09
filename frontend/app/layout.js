import "./globals.css";

export const metadata = {
  title: "Jagadesh | Digital Me",
  description:
    "Chat with an AI version of Jagadesh. Answers come only from his real resume and notes.",
};

// Runs before the first paint so the page never flashes the wrong theme.
// Uses the visitor's saved choice, otherwise their system light/dark setting.
const themeScript = `(function(){try{
var ok=['oxford','mint','royal','lime','forest'];
var t=localStorage.getItem('dm-theme');
if(!t||ok.indexOf(t)<0){t=window.matchMedia('(prefers-color-scheme: light)').matches?'royal':'oxford';}
document.documentElement.dataset.theme=t;
}catch(e){}})();`;

export default function RootLayout({ children }) {
  return (
    <html lang="en" data-theme="oxford" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
