import "./globals.css";
import "./mobile.css";

const SITE_URL = "https://digital-me-phi.vercel.app";
const TITLE = "Jagadesh | Digital Me";
const DESCRIPTION =
  "Chat with an AI version of Jagadesh. Ask about his projects, skills and education. Answers come only from his real resume and notes.";

// The preview image (app/opengraph-image.png) and site icon (app/icon.png) are picked up
// automatically by Next.js from those file names.
export const metadata = {
  metadataBase: new URL(SITE_URL),
  title: TITLE,
  description: DESCRIPTION,
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    url: SITE_URL,
    siteName: "Jagadesh | Digital Me",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
  },
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
