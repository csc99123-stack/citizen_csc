# Skill: Dynamic PDF Generator

## Purpose
Directs the agent on dynamically parsing raw HTML containing mapped placeholder tags, transforming them with live user context, and generating pixel-perfect, print-ready A4 PDFs for users.

## Guidelines & Architecture Walkthrough

### 1. Parsing and Preparing HTML
- **Template Source:** Fetch your raw HTML template structurally stored in Supabase (`html_templates` table).
- **Placeholder Replacement:** Utilize a fast string replacement model (like native `.replace()`, handle bars, or RegEx) to strip all `{{tag_name}}` variants found in the `raw_html` and inject the JSON values parsed gracefully from the user's latest form submission.

### 2. Client-Side Rendering with `html2pdf.js` (Preferred for speed/simplicity)
- **Injection:** Mount the parsed raw HTML string securely via React's `dangerouslySetInnerHTML` into a visually hidden container `div` on the client's DOM. 
- **PDF Construction:**
  - Import `html2pdf.js` dynamically to avoid Server-component initialization errors (`const html2pdf = (await import('html2pdf.js')).default`).
  - Strict Configuration: Target A4 format exclusively for generic CSC printing.
  ```javascript
  const options = {
    margin: 10,
    filename: `generated_form_${Date.now()}.pdf`,
    image: { type: 'jpeg', quality: 0.98 },
    html2canvas: { scale: 2, useCORS: true }, 
    jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
  };
  html2pdf().from(hiddenDivRef.current).set(options).save();
  ```

### 3. Server-Side Execution with `pdf-lib` (If needed for secure/headless ops)
- If generation happens securely out of bounds from the browser (e.g., Email attachments), use headless rendering (like Puppeteer or dynamic server-sided APIs) to generate a PDF buffer, load the buffer using `pdf-lib` to layer overlays if needed, and push directly to Supabase Storage before delivering the secured payload link.
