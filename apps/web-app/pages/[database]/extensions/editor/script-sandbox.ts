import type { ICommand } from "@/packages/core/meta-table/extension";

declare global {
  interface Window {
    resolveModule: (value: {
      commands: ICommand[]
    }) => void;
    rejectModule: (reason?: any) => void;
    scriptExports: any;
    resolveObjects: (value: Record<string, any>) => void;
    rejectObjects: (reason?: any) => void;
  }
}



export class ScriptSandbox {
  private iframe: HTMLIFrameElement | null = null

  constructor() {
    this.iframe = document.createElement("iframe")
    this.iframe.style.display = "none"
    document.body.appendChild(this.iframe)
  }

  async extractExports(scriptContent: string): Promise<ICommand[] | undefined> {
    if (!this.iframe?.contentWindow) {
      throw new Error("Sandbox iframe not initialized")
    }

    const blob = new Blob([scriptContent], { type: 'text/javascript' })
    const moduleUrl = URL.createObjectURL(blob)

    try {
      // console.log('iframe content before loading script:', this.iframe.contentWindow.document.body.innerHTML)

      const exports = await new Promise<{
        commands: ICommand[]
      }>((resolve, reject) => {
        this.iframe!.contentWindow!.resolveModule = resolve;
        this.iframe!.contentWindow!.rejectModule = reject;

        const script = this.iframe!.contentWindow!.document.createElement("script")
        script.type = "module"
        script.textContent = `
          import('${moduleUrl}')
            .then(module => {
              window.scriptExports = module;
              console.log('Module loaded:', module);
              window.resolveModule(module);
            })
            .catch(error => {
              console.error('Module loading error:', error);
              window.rejectModule(error);
            });
        `
        this.iframe!.contentWindow!.document.body.appendChild(script)

        // console.log('iframe content after adding script:', this.iframe!.contentWindow!.document.body.innerHTML)
      });
      return exports.commands
    } catch (error) {
      console.error('Error loading script:', error)
      throw error
    } finally {
      URL.revokeObjectURL(moduleUrl)
    }
  }

  async detectObjects(scriptContent: string): Promise<Record<string, any>> {
    if (!this.iframe?.contentWindow) {
      throw new Error("Sandbox iframe not initialized")
    }

    const blob = new Blob([scriptContent], { type: 'text/javascript' })
    const scriptUrl = URL.createObjectURL(blob)

    try {
      const objects = await new Promise<Record<string, any>>((resolve, reject) => {
        this.iframe!.contentWindow!.resolveObjects = resolve;
        this.iframe!.contentWindow!.rejectObjects = reject;

        const script = this.iframe!.contentWindow!.document.createElement("script")
        script.textContent = `
          // Store initial global keys
          const initialKeys = new Set(Object.keys(window));
          
          // Function to analyze script content and extract functions
          function analyzeScript(code) {
            const newObjects = {};
            
            // First try to execute the script to capture global variables
            try {
              // Execute the script in the global context
              eval(code);
              
              // Find new global objects
              const currentKeys = Object.keys(window);
              
              for (const key of currentKeys) {
                // Skip initial keys and our helper functions
                if (!initialKeys.has(key) && 
                    key !== 'resolveObjects' && 
                    key !== 'rejectObjects') {
                  try {
                    const value = window[key];
                    newObjects[key] = value;
                  } catch (err) {
                    console.warn('Could not access property:', key);
                  }
                }
              }
            } catch (error) {
              console.error('Script execution error:', error);
            }
            
            // Try to detect function declarations even if they're not global
            try {
              // Look for function declarations using regex
              const functionRegex = /function\\s+([a-zA-Z_$][a-zA-Z0-9_$]*)\\s*\\(/g;
              let match;
              
              while ((match = functionRegex.exec(code)) !== null) {
                const funcName = match[1];
                
                // If we haven't already captured this function as a global
                if (!newObjects[funcName]) {
                  try {
                    // Try to evaluate the function in isolation
                    const funcEval = new Function(\`
                      try {
                        \${code}
                        return typeof \${funcName} === 'function' ? \${funcName} : null;
                      } catch(e) {
                        console.error('Function evaluation error:', e);
                        return null;
                      }
                    \`)();
                    
                    if (funcEval) {
                      newObjects[funcName] = funcEval;
                    }
                  } catch (err) {
                    console.warn('Could not evaluate function:', funcName);
                  }
                }
              }
              
              // Also look for arrow functions and function expressions assigned to variables
              const varFuncRegex = /(?:const|let|var)\\s+([a-zA-Z_$][a-zA-Z0-9_$]*)\\s*=\\s*(?:function|\\(.*\\)\\s*=>)/g;
              while ((match = varFuncRegex.exec(code)) !== null) {
                const varName = match[1];
                
                // If we haven't already captured this variable
                if (!newObjects[varName]) {
                  try {
                    // Try to evaluate the variable
                    const varEval = new Function(\`
                      try {
                        \${code}
                        return \${varName};
                      } catch(e) {
                        console.error('Variable evaluation error:', e);
                        return null;
                      }
                    \`)();
                    
                    if (varEval && typeof varEval === 'function') {
                      newObjects[varName] = varEval;
                    }
                  } catch (err) {
                    console.warn('Could not evaluate variable:', varName);
                  }
                }
              }
            } catch (regexError) {
              console.error('Regex analysis error:', regexError);
            }
            
            return newObjects;
          }
          
          // Load and execute the script
          fetch('${scriptUrl}')
            .then(response => response.text())
            .then(code => {
              const detectedObjects = analyzeScript(code);
              window.resolveObjects(detectedObjects);
            })
            .catch(error => {
              console.error('Script loading error:', error);
              window.rejectObjects(error);
            });
        `
        this.iframe!.contentWindow!.document.body.appendChild(script)
      });

      return objects;
    } catch (error) {
      console.error('Error detecting objects in script:', error)
      throw error
    } finally {
      URL.revokeObjectURL(scriptUrl)
    }
  }

  destroy() {
    if (this.iframe) {
      document.body.removeChild(this.iframe)
      this.iframe = null
    }
  }
}
