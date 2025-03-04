/**
 * GigaChode Toggle Button - Standalone Implementation
 * This script will add the toggle button to the AI interface
 */
(function() {
  // Function to create and add the toggle button
  function addGigaChodeToggle() {
    console.log("GigaChode Toggle: Attempting to add toggle button");
    
    // Remove any existing toggle to avoid duplicates
    const existingToggle = document.getElementById('gigachode-theme-toggle');
    if (existingToggle) {
      existingToggle.remove();
    }
    
    // Create the toggle button
    const toggleBtn = document.createElement('button');
    toggleBtn.id = 'gigachode-theme-toggle';
    toggleBtn.className = 'gigachode-toggle';
    toggleBtn.innerHTML = '⚙️';
    toggleBtn.title = 'Toggle AI Personality';
    
    // Apply inline styles to ensure visibility
    Object.assign(toggleBtn.style, {
      position: 'absolute',
      top: '10px',
      right: '50px',
      zIndex: '9999',
      background: 'none',
      border: 'none',
      color: '#00ffff',
      textShadow: '0 0 5px #00ffff',
      fontSize: '24px',
      cursor: 'pointer',
      padding: '5px',
      transition: 'transform 0.3s ease'
    });
    
    // Add hover effect
    toggleBtn.addEventListener('mouseenter', () => {
      toggleBtn.style.transform = 'rotate(180deg)';
    });
    
    toggleBtn.addEventListener('mouseleave', () => {
      toggleBtn.style.transform = 'rotate(0deg)';
    });
    
    // Add click handler to toggle theme
    toggleBtn.addEventListener('click', () => {
      console.log("GigaChode Toggle: Button clicked");
      
      // Toggle the theme class
      const aiAssistant = document.querySelector('.ai-assistant, .ai-window');
      if (aiAssistant) {
        const isEnabled = aiAssistant.classList.contains('gigachode-theme');
        
        if (isEnabled) {
          aiAssistant.classList.remove('gigachode-theme');
          localStorage.setItem('gigachode-theme-enabled', 'false');
          console.log("GigaChode Toggle: Theme disabled");
        } else {
          aiAssistant.classList.add('gigachode-theme');
          localStorage.setItem('gigachode-theme-enabled', 'true');
          console.log("GigaChode Toggle: Theme enabled");
        }
        
        // Announce the change in chat if possible
        const aiChatMessages = document.querySelector('.ai-chat-messages');
        if (aiChatMessages) {
          const aiMsg = document.createElement('div');
          aiMsg.className = 'ai-message';
          aiMsg.textContent = isEnabled ? 
            "Reverting to standard AI assistant mode. GigaChode will be back!" :
            "GigaChode personality activated! Looking chunky and feeling funky!";
          aiChatMessages.appendChild(aiMsg);
          aiChatMessages.scrollTop = aiChatMessages.scrollHeight;
        }
      }
    });
    
    // Find the AI interface container
    const aiContainer = document.querySelector('.ai-assistant, .ai-window, .ai-chat-interface');
    if (aiContainer) {
      // Add the button to the container
      aiContainer.appendChild(toggleBtn);
      console.log("GigaChode Toggle: Button added to", aiContainer);
      return true;
    } else {
      // If we can't find the container, add to body as fallback
      document.body.appendChild(toggleBtn);
      console.log("GigaChode Toggle: Button added to body as fallback");
      return true;
    }
    
    return false;
  }
  
  // Apply theme from localStorage
  function applyThemeFromStorage() {
    const themeEnabled = localStorage.getItem('gigachode-theme-enabled');
    const aiAssistant = document.querySelector('.ai-assistant, .ai-window');
    
    if (aiAssistant) {
      if (themeEnabled === 'true') {
        aiAssistant.classList.add('gigachode-theme');
        console.log("GigaChode Toggle: Theme applied from storage");
      } else {
        aiAssistant.classList.remove('gigachode-theme');
      }
    }
  }
  
  // Try to add the toggle button when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      applyThemeFromStorage();
      addGigaChodeToggle();
    });
  } else {
    applyThemeFromStorage();
    addGigaChodeToggle();
  }
  
  // Try again after a delay to ensure all elements are loaded
  setTimeout(() => {
    addGigaChodeToggle();
  }, 1000);
  
  // And again after a longer delay as a fallback
  setTimeout(() => {
    addGigaChodeToggle();
  }, 3000);
  
  // Add a global function for manual triggering
  window.addGigaChodeToggle = addGigaChodeToggle;
  
  // Add a global function to toggle the theme directly
  window.toggleGigaChodeTheme = function() {
    const aiAssistant = document.querySelector('.ai-assistant, .ai-window');
    if (aiAssistant) {
      const isEnabled = aiAssistant.classList.contains('gigachode-theme');
      
      if (isEnabled) {
        aiAssistant.classList.remove('gigachode-theme');
        localStorage.setItem('gigachode-theme-enabled', 'false');
        console.log("GigaChode theme disabled");
        return "Standard AI mode activated";
      } else {
        aiAssistant.classList.add('gigachode-theme');
        localStorage.setItem('gigachode-theme-enabled', 'true');
        console.log("GigaChode theme enabled");
        return "GigaChode mode activated!";
      }
    }
    return "Could not find AI assistant element";
  };
})(); 