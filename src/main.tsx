
import { createRoot } from "react-dom/client";
import "./index.css";

console.log('🚀 Main.tsx loaded');

// Render a simple test first
const root = document.getElementById("root");

if (!root) {
  console.error('❌ Root element not found!');
} else {
  console.log('✅ Root element found');
  
  // Show loading message
  root.innerHTML = '<div style="padding: 20px;">Loading MotoRent...</div>';
  
  try {
    console.log('🔧 Importing App...');
    import("./App.tsx").then((module) => {
      const App = module.default;
      console.log('✅ App imported');
      
      console.log('🔧 Importing Supabase...');
      import("./lib/supabase").then(({ supabase }) => {
        console.log('✅ Supabase imported');
        
        // Expose supabase to window for debugging
        if (typeof window !== 'undefined') {
          (window as any).supabase = supabase;
        }
        
        console.log('🎨 Rendering App...');
        createRoot(root).render(<App />);
        console.log('✅ App rendered');
      }).catch((error) => {
        console.error('❌ Error importing Supabase:', error);
        root.innerHTML = `
          <div style="padding: 20px; font-family: monospace; background: #fee;">
            <h1 style="color: red;">Error Loading Supabase</h1>
            <pre style="background: #fff; padding: 10px; overflow: auto;">${error.message || error}</pre>
            <p>Check your .env file and ensure Supabase credentials are correct.</p>
          </div>
        `;
      });
    }).catch((error) => {
      console.error('❌ Error importing App:', error);
      root.innerHTML = `
        <div style="padding: 20px; font-family: monospace; background: #fee;">
          <h1 style="color: red;">Error Loading App</h1>
          <pre style="background: #fff; padding: 10px; overflow: auto;">${error.message || error}</pre>
        </div>
      `;
    });
  } catch (error: any) {
    console.error('❌ Critical error:', error);
    root.innerHTML = `
      <div style="padding: 20px; font-family: monospace; background: #fee;">
        <h1 style="color: red;">Critical Error</h1>
        <pre style="background: #fff; padding: 10px; overflow: auto;">${error.message || error}</pre>
      </div>
    `;
  }
}
  