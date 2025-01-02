const jiraDomain = window.location.origin;  // Usa o domain atual logado


async function fetchSLA(ticketKey) {
  const url = `${jiraDomain}/rest/api/3/issue/${ticketKey}`;
  const response = await fetch(url);
  if (response.ok) {
    const data = await response.json();
    const slaField = data.fields["customfield_10082"]; // Acesse a API com o seu dominio e verifique no retorno da API o campo que retorna o SLA 
    // https://SEU DOMAIN/rest/api/3/issue/ID TICKET
    if (slaField && slaField.ongoingCycle && slaField.ongoingCycle.remainingTime) {
      const remainingMillis = slaField.ongoingCycle.remainingTime.millis;
      return remainingMillis / (1000 * 60 * 60);
    }
  }
  return null;
}
function applyColor(card, slaTime) {
  if (slaTime <= 5) {
    card.style.border = '2px solid red'; 
  } else if (slaTime <= 20) {
    card.style.border = '2px solid orange'; 
  } else {
    card.style.border = '2px solid green'; 
  }
}

// Se sua estrutura utilizar uma KEY para a identificação dos tickets, faça a adaptação aqui
// Nesse caso a identicação é usava em texto no meu card atrelado já no button, eu vou extrair a chave
function extractTicketKey(ariaLabel) {
  const match = ariaLabel.match(/([A-Za-z]+-\d+)/);
  return match ? match[1] : null;
}

async function processCard(card) {
  const ariaLabel = card.getAttribute("aria-label");
  const ticketKey = extractTicketKey(ariaLabel);
  
  if (ticketKey) {
    const slaTime = await fetchSLA(ticketKey);
    if (slaTime !== null) {
      applyColor(card, slaTime);
    }
  }
}
function isCardVisible(card) {
  const rect = card.getBoundingClientRect();
  return rect.top >= 0 && rect.bottom <= window.innerHeight;
}

async function processVisibleCards() {
  const cards = document.querySelectorAll('button.css-lvug9a[aria-label]'); 
  for (const card of cards) {
    if (isCardVisible(card)) {
      await processCard(card);
    }
  }
}

let scrollTimeout;
function onScroll() {
  // Defini um time de 300ms para evitar sobrecarga e apresentar lentidão por chamadas excessivas dependendo do estado atual do quadro
  clearTimeout(scrollTimeout);
  scrollTimeout = setTimeout(() => {
    requestAnimationFrame(processVisibleCards);
  }, 300);
}

const observer = new MutationObserver(() => {
  requestAnimationFrame(processVisibleCards);
});
observer.observe(document.body, { childList: true, subtree: true });
window.addEventListener('scroll', onScroll);
window.addEventListener("load", () => {
  requestAnimationFrame(processVisibleCards); 
});
