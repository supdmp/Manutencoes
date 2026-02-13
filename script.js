// Variáveis globais
let currentEditingRow = null;
let allData = [];
let currentFilter = 'all';

// =====================================================
// FUNÇÕES DE API - GET E POST
// =====================================================

// Função auxiliar para fazer requisições GET à API
async function fetchSheet(sheetName) {
    try {
        const url = `${CONFIG.API_URL}?sheet=${encodeURIComponent(sheetName)}`;
        console.log('GET - Carregando planilha:', sheetName);
        console.log('URL:', url);

        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        console.log('Dados recebidos de', sheetName, ':', data.length, 'registros');

        return data;
    } catch (error) {
        console.error('Erro ao carregar planilha:', sheetName, error);
        throw error;
    }
}

// Função para adicionar nova empresa (POST)
async function adicionarEmpresa(cnpj, razaoSocial) {
    try {
        const url = CONFIG.API_URL;
        console.log('POST - Adicionando empresa:', razaoSocial);
        console.log('URL:', url);

        const payload = {
            sheet: 'empresas',
            action: 'add',
            CNPJ: cnpj,
            Razao_Social: razaoSocial,
            Ativa: 'SIM'
        };

        console.log('Payload:', JSON.stringify(payload));

        const response = await fetch(url, {
            method: 'POST',
            mode: 'cors',
            redirect: 'follow',
            headers: {
                'Content-Type': 'text/plain;charset=utf-8'
            },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('Erro na resposta:', errorText);
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();
        console.log('Empresa adicionada:', result);

        if (result.error) {
            throw new Error(result.message || 'Erro ao adicionar empresa');
        }

        return result;
    } catch (error) {
        console.error('Erro ao adicionar empresa:', error);
        throw error;
    }
}

// Função para atualizar manutenção (POST)
async function atualizarManutencao(cnpj, atendidoPor, dataAtendimento, acompanhadoPor, observacoes) {
    try {
        const sheetName = CONFIG.SHEETS.EMPRESAS; // Ex: "fevereiro-2026"
        const url = CONFIG.API_URL;
        console.log('POST - Atualizando manutenção:', cnpj);
        console.log('URL:', url);

        const payload = {
            sheet: sheetName,
            action: 'update',
            CNPJ: cnpj,
            Atendido_Por: atendidoPor,
            Data_De_Atendimento: dataAtendimento,
            Acompanhado_Por: acompanhadoPor,
            Observacoes: observacoes
        };

        console.log('Payload:', JSON.stringify(payload));

        const response = await fetch(url, {
            method: 'POST',
            mode: 'cors',
            redirect: 'follow',
            headers: {
                'Content-Type': 'text/plain;charset=utf-8'
            },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('Erro na resposta:', errorText);
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();
        console.log('Manutenção atualizada:', result);

        if (result.error) {
            throw new Error(result.message || 'Erro ao atualizar manutenção');
        }

        return result;
    } catch (error) {
        console.error('Erro ao atualizar manutenção:', error);
        throw error;
    }
}

// Função para atualizar senha do usuário (POST)
async function atualizarSenha(email, novaSenha) {
    try {
        const url = CONFIG.API_URL;
        console.log('POST - Atualizando senha do usuário:', email);
        console.log('URL:', url);

        const payload = {
            sheet: 'Usuarios',
            action: 'updatePassword',
            Email: email,
            Senha: novaSenha
        };

        console.log('Payload:', JSON.stringify(payload));

        const response = await fetch(url, {
            method: 'POST',
            mode: 'cors',
            redirect: 'follow',
            headers: {
                'Content-Type': 'text/plain;charset=utf-8'
            },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('Erro na resposta:', errorText);
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();
        console.log('Senha atualizada:', result);

        if (result.error) {
            throw new Error(result.message || 'Erro ao atualizar senha');
        }

        return result;
    } catch (error) {
        console.error('Erro ao atualizar senha:', error);
        throw error;
    }
}

// =====================================================
// FUNÇÕES DE AUTENTICAÇÃO E LOGOUT
// =====================================================

// Função de logout - DEVE estar disponível globalmente desde o início
function logout() {
    if (confirm('Tem certeza que deseja sair do sistema?')) {
        localStorage.removeItem('loggedUser');
        sessionStorage.removeItem('loggedUser');
        window.location.href = 'login.html';
    }
}

// Expor logout globalmente IMEDIATAMENTE
window.logout = logout;

// Inicializar quando DOM estiver pronto
window.addEventListener('DOMContentLoaded', function () {
    console.log('DOM carregado!');

    // Verificar se estamos na página principal (tem o formulário)
    if (document.getElementById('maintenanceForm')) {
        inicializarApp();
    } else {
        console.log('Página secundária detectada - App principal não inicializado');
    }
});

// Verificar se usuário está autenticado
function verificarAutenticacao() {
    const loggedUser = localStorage.getItem('loggedUser') || sessionStorage.getItem('loggedUser');

    if (!loggedUser) {
        // Não está logado - redirecionar para login
        window.location.href = 'login.html';
        return false;
    }

    console.log('Usuário autenticado:', loggedUser);
    return true;
}

// Exibir nome do usuário no header
function exibirNomeUsuario() {
    const loggedUser = localStorage.getItem('loggedUser') || sessionStorage.getItem('loggedUser');
    const nomeUsuarioElement = document.getElementById('nomeUsuario');

    if (nomeUsuarioElement && loggedUser) {
        nomeUsuarioElement.textContent = loggedUser;
        console.log('Nome do usuário exibido:', loggedUser);
    }
}

function inicializarApp() {
    console.log('Inicializando aplicação...');
    console.log('✓ Funções POST carregadas no script.js');

    // Exibir nome do usuário
    exibirNomeUsuario();

    // Configurar botão de busca
    const btnPesquisar = document.getElementById('searchBtn');
    if (btnPesquisar) {
        btnPesquisar.onclick = function () {
            console.log('Botão Pesquisar clicado!');
            buscar();
        };
        console.log('✓ Botão Pesquisar configurado');
    } else {
        console.error('✗ Botão Pesquisar NÃO encontrado!');
    }

    // Configurar campo de busca (Enter)
    const campoBusca = document.getElementById('searchInput');
    if (campoBusca) {
        campoBusca.onkeypress = function (e) {
            if (e.key === 'Enter') {
                console.log('Enter pressionado!');
                buscar();
            }
        };
        console.log('✓ Campo de busca configurado');
    }

    // Configurar botão adicionar
    const btnAdicionar = document.getElementById('addButton');
    if (btnAdicionar) {
        btnAdicionar.onclick = abrirModal;
        console.log('✓ Botão Adicionar configurado');
    }

    // Configurar modal
    const btnFechar = document.querySelector('.close');
    const btnCancelar = document.getElementById('cancelButton');
    if (btnFechar) btnFechar.onclick = fecharModal;
    if (btnCancelar) btnCancelar.onclick = fecharModal;

    // Configurar formulário
    const formulario = document.getElementById('maintenanceForm');
    if (formulario) {
        formulario.onsubmit = function (e) {
            e.preventDefault();
            salvarDados();
        };
    }

    // Configurar máscara CNPJ
    const cnpjInput = document.getElementById('cnpj');
    if (cnpjInput) {
        cnpjInput.oninput = function (e) {
            e.target.value = aplicarMascaraCNPJ(e.target.value);
        };
    }

    // Carregar dados
    carregarDados();
}

// FUNÇÃO DE BUSCA - PRINCIPAL
function buscar() {
    console.log('=== FUNÇÃO BUSCAR EXECUTADA ===');

    const campoBusca = document.getElementById('searchInput');
    const termo = campoBusca.value.trim().toLowerCase();

    console.log('Termo digitado:', termo);
    console.log('Total de dados:', allData.length);

    if (!termo) {
        console.log('Busca vazia - aplicando filtro atual');
        aplicarFiltro();
        return;
    }

    // Filtrar dados
    const resultados = allData.filter(function (item) {
        const razaoSocial = (item.Razao_Social || item['Razao Social'] || item['Razão Social'] || item['Razão_Social'] || '').toLowerCase();
        const cnpj = String(item.CNPJ || '').replace(/\D/g, '');
        const termoNumeros = termo.replace(/\D/g, '');

        const encontrouNome = razaoSocial.includes(termo);
        const encontrouCNPJ = cnpj.includes(termoNumeros);

        if (termoNumeros == '') {
            return encontrouNome;
        }
        return encontrouCNPJ;
    });

    console.log('Resultados encontrados:', resultados.length);

    renderizarTabela(resultados);

    if (resultados.length === 0) {
        const tbody = document.getElementById('tableBody');
        tbody.innerHTML = '<tr><td colspan="5" style="text-align: center; padding: 40px; color: #999;">Nenhum resultado encontrado para "' + termo + '"</td></tr>';
    }
}

// Carregar dados da API
async function carregarDados() {
    const loading = document.getElementById('loadingIndicator');
    loading.classList.add('active');

    try {
        console.log('Carregando manutenções da planilha:', CONFIG.SHEETS.EMPRESAS);

        // Carregar todas as manutenções do mês atual
        allData = await fetchSheet(CONFIG.SHEETS.EMPRESAS);
        console.log('Manutenções carregadas:', allData.length);
        console.log('Primeiro registro:', allData[0]);

        // Verificar campos
        if (allData.length > 0) {
            console.log('Campos disponíveis:', Object.keys(allData[0]));
        }

        renderizarTabela(allData);
        atualizarStats(allData);

    } catch (erro) {
        console.error('Erro ao carregar dados:', erro);
        alert('Erro ao carregar dados: ' + erro.message);
    } finally {
        loading.classList.remove('active');
    }
}

// Renderizar tabela
function renderizarTabela(dados) {
    const tbody = document.getElementById('tableBody');
    const thead = document.querySelector('#dataTable thead tr');
    tbody.innerHTML = '';

    console.log('Renderizando', dados.length, 'registros');

    if (dados.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" style="text-align: center; padding: 40px;">Nenhum registro encontrado</td></tr>';
        return;
    }

    // Verificar se está no filtro "Atendidas" (completed)
    const mostrarDetalhes = currentFilter === 'completed';
    console.log('Modo detalhes (Atendidas):', mostrarDetalhes);
    console.log('Filtro atual:', currentFilter);

    // Atualizar cabeçalho da tabela
    if (mostrarDetalhes) {
        // Filtro Atendidas - mostra detalhes completos
        thead.innerHTML = `
            <th>Razão Social</th>
            <th>CNPJ</th>
            <th>Atendido Por</th>
            <th>Data de Atendimento</th>
            <th>Acompanhado Por</th>
        `;
    } else if (currentFilter === 'all') {
        // Filtro Todas - mostra Data de Atendimento e ações
        thead.innerHTML = `
            <th>Razão Social</th>
            <th>CNPJ</th>
            <th>Data de Atendimento</th>
            <th>Status</th>
            <th>Ações</th>
        `;
    } else {
        // Filtros Pendentes ou Atrasadas - mostra Mês da Manutenção
        thead.innerHTML = `
            <th>Razão Social</th>
            <th>CNPJ</th>
            <th>Mês da Manutenção</th>
            <th>Status</th>
            <th>Ações</th>
        `;
    }

    dados.forEach(function (item, index) {
        const razaoSocial = item.Razao_Social || item['Razao Social'] || item['Razão Social'] || item['Razão_Social'] || '';
        const cnpj = String(item.CNPJ || '');
        const dataAtendimento = item.Data_De_Atendimento || item['Data De Atendimento'] || item['Data_De_Atendimento'] || '';
        const atendidoPor = item.Atendido_Por || item['Atendido Por'] || '';
        const acompanhadoPor = item.Acompanhado_Por || item['Acompanhado Por'] || '';

        // Debug primeiro item
        if (index === 0) {
            console.log('Primeiro item:', {
                razaoSocial,
                cnpj,
                dataAtendimento,
                atendidoPor,
                acompanhadoPor
            });
        }

        // Formatar data
        const mes = formatarDataParaMes(dataAtendimento);
        const dataCompleta = formatarDataCompleta(dataAtendimento);

        const status = calcularStatus(dataAtendimento);
        const badgeStatus = gerarBadge(status);

        const tr = document.createElement('tr');

        if (mostrarDetalhes) {
            // Modo Atendidas - mostra detalhes
            tr.innerHTML =
                '<td>' + razaoSocial + '</td>' +
                '<td>' + formatarCNPJ(cnpj) + '</td>' +
                '<td>' + atendidoPor + '</td>' +
                '<td>' + dataCompleta + '</td>' +
                '<td>' + acompanhadoPor + '</td>';
        } else if (currentFilter === 'all') {
            // Filtro Todas - mostra data completa ao invés de mês
            // Encontrar índice no allData original
            const indexNoAllData = allData.findIndex(d => String(d.CNPJ) === cnpj);

            // Verificar permissão de edição
            const temPermissao = podeEditar(item);
            const btnEditar = temPermissao
                ? '<button class="btn btn-edit" onclick="editarLinha(' + indexNoAllData + ')">✏️ Editar</button>'
                : '<button class="btn" style="background: #ccc; cursor: not-allowed;" disabled title="Apenas ' + atendidoPor + ' pode editar">🔒 Bloqueado</button>';

            tr.innerHTML =
                '<td>' + razaoSocial + '</td>' +
                '<td>' + formatarCNPJ(cnpj) + '</td>' +
                '<td>' + dataCompleta + '</td>' +
                '<td>' + badgeStatus + '</td>' +
                '<td class="actions">' + btnEditar + '</td>';
        } else {
            // Filtros Pendentes/Atrasadas - mostra mês
            // Encontrar índice no allData original
            const indexNoAllData = allData.findIndex(d => String(d.CNPJ) === cnpj);

            // Verificar permissão de edição
            const temPermissao = podeEditar(item);
            const btnEditar = temPermissao
                ? '<button class="btn btn-edit" onclick="editarLinha(' + indexNoAllData + ')">✏️ Editar</button>'
                : '<button class="btn" style="background: #ccc; cursor: not-allowed;" disabled title="Apenas ' + atendidoPor + ' pode editar">🔒 Bloqueado</button>';

            tr.innerHTML =
                '<td>' + razaoSocial + '</td>' +
                '<td>' + formatarCNPJ(cnpj) + '</td>' +
                '<td>' + mes + '</td>' +
                '<td>' + badgeStatus + '</td>' +
                '<td class="actions">' + btnEditar + '</td>';
        }

        tbody.appendChild(tr);
    });
}

// Formatar data ISO para MM/YYYY
function formatarDataParaMes(dataISO) {
    if (!dataISO) return '';

    try {
        const data = new Date(dataISO);
        const mes = String(data.getMonth() + 1).padStart(2, '0');
        const ano = data.getFullYear();
        return mes + '/' + ano;
    } catch (e) {
        return '';
    }
}

// Formatar data completa DD/MM/YYYY
function formatarDataCompleta(dataISO) {
    if (!dataISO) return '';

    try {
        const data = new Date(dataISO);
        const dia = String(data.getDate()).padStart(2, '0');
        const mes = String(data.getMonth() + 1).padStart(2, '0');
        const ano = data.getFullYear();
        return dia + '/' + mes + '/' + ano;
    } catch (e) {
        return '';
    }
}

// Calcular status baseado na presença de Data_De_Atendimento
function calcularStatus(dataAtendimento) {
    // Se Data_De_Atendimento está vazia → Pendente
    // Se Data_De_Atendimento está preenchida → Atendida
    if (!dataAtendimento || dataAtendimento.trim() === '') {
        return 'pendente';
    } else {
        return 'atendida';
    }
}

// Gerar badge
function gerarBadge(status) {
    const badges = {
        'atendida': '<span class="status-badge status-atendida">Atendida</span>',
        'pendente': '<span class="status-badge status-pendente">Pendente</span>',
        'atrasada': '<span class="status-badge status-atrasada">Atrasada</span>'
    };
    return badges[status] || badges['pendente'];
}

// Formatar CNPJ
function formatarCNPJ(cnpj) {
    if (!cnpj) return '';

    // Converter para string se for número
    const cnpjString = String(cnpj);
    const numeros = cnpjString.replace(/\D/g, '');

    if (numeros.length === 14) {
        return numeros.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, '$1.$2.$3/$4-$5');
    }
    return cnpjString;
}

// Aplicar máscara CNPJ
function aplicarMascaraCNPJ(valor) {
    let numeros = valor.replace(/\D/g, '');
    numeros = numeros.substring(0, 14);

    if (numeros.length <= 2) return numeros;
    if (numeros.length <= 5) return numeros.replace(/^(\d{2})(\d{0,3})/, '$1.$2');
    if (numeros.length <= 8) return numeros.replace(/^(\d{2})(\d{3})(\d{0,3})/, '$1.$2.$3');
    if (numeros.length <= 12) return numeros.replace(/^(\d{2})(\d{3})(\d{3})(\d{0,4})/, '$1.$2.$3/$4');
    return numeros.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{0,2})/, '$1.$2.$3/$4-$5');
}

// Atualizar estatísticas
function atualizarStats(dados) {
    console.log('=== ATUALIZAR STATS ===');
    const total = dados.length;

    let atendidas = 0, pendentes = 0, atrasadas = 0;

    dados.forEach(function (item) {
        const dataAtendimento = item.Data_De_Atendimento || item['Data De Atendimento'] || item['Data_De_Atendimento'];

        if (!dataAtendimento || dataAtendimento.trim() === '') {
            pendentes++;
        } else {
            atendidas++;
        }
    });

    // Atrasadas não é mais usado neste modelo, mas mantemos por compatibilidade
    atrasadas = 0;

    console.log('Estatísticas:', {
        total,
        atendidas,
        pendentes,
        atrasadas
    });

    // Verificar se elementos existem antes de atualizar (para compatibilidade com relatórios)
    const completedCountEl = document.getElementById('completedCount');
    const pendingCountEl = document.getElementById('pendingCount');
    const overdueCountEl = document.getElementById('overdueCount');
    const totalCountEl = document.getElementById('totalCount');

    if (completedCountEl) completedCountEl.textContent = atendidas;
    if (pendingCountEl) pendingCountEl.textContent = pendentes;
    if (overdueCountEl) overdueCountEl.textContent = atrasadas;
    if (totalCountEl) totalCountEl.textContent = total;
}

// Filtrar dados
function filtrarDados(tipo) {
    console.log('Filtro:', tipo);
    currentFilter = tipo;

    // Verificar se elementos existem antes de acessar (para compatibilidade com relatórios)
    const completedCard = document.getElementById('completedCard');
    const pendingCard = document.getElementById('pendingCard');
    const overdueCard = document.getElementById('overdueCard');
    const totalCard = document.getElementById('totalCard');

    if (completedCard) completedCard.classList.remove('active');
    if (pendingCard) pendingCard.classList.remove('active');
    if (totalCard) totalCard.classList.remove('active');

    if (tipo === 'completed' && completedCard) {
        completedCard.classList.add('active');
    } else if (tipo === 'pending' && pendingCard) {
        pendingCard.classList.add('active');

    } else if (totalCard) {
        totalCard.classList.add('active');
    }

    aplicarFiltro();
}

// Aplicar filtro atual
function aplicarFiltro() {
    console.log('=== APLICAR FILTRO ===');
    console.log('Filtro atual:', currentFilter);
    console.log('Total de dados:', allData.length);

    let dadosFiltrados = allData;

    if (currentFilter === 'completed') {
        // Atendidas - Data_De_Atendimento preenchida
        dadosFiltrados = allData.filter(function (item) {
            const dataAtendimento = item.Data_De_Atendimento || item['Data De Atendimento'] || item['Data_De_Atendimento'];
            const temData = dataAtendimento && dataAtendimento.trim() !== '';

            if (temData) {
                console.log('Item ATENDIDO:', item.Razao_Social || item['Razao Social'], 'Data:', dataAtendimento);
            }

            return temData;
        });

        console.log('Atendidas encontradas:', dadosFiltrados.length);

    } else if (currentFilter === 'pending') {
        // Pendentes - Data_De_Atendimento vazia
        dadosFiltrados = allData.filter(function (item) {
            const dataAtendimento = item.Data_De_Atendimento || item['Data De Atendimento'] || item['Data_De_Atendimento'];
            return !dataAtendimento || dataAtendimento.trim() === '';
        });

        console.log('Pendentes encontradas:', dadosFiltrados.length);


    }

    console.log('Dados filtrados:', dadosFiltrados.length);
    renderizarTabela(dadosFiltrados);
}

// Modal
function abrirModal() {
    currentEditingRow = null;
    document.getElementById('modalTitle').textContent = 'Nova Empresa';
    document.getElementById('maintenanceForm').reset();

    // Garantir que loading esteja oculto
    const modalLoading = document.getElementById('modalLoading');
    if (modalLoading) modalLoading.classList.remove('active');

    // Mostrar apenas campos de nova empresa
    document.getElementById('editFields').style.display = 'none';
    document.getElementById('razaoSocial').readOnly = false;
    document.getElementById('cnpj').readOnly = false;

    // Limpar required dos campos de edição
    document.getElementById('dataAtendimento').removeAttribute('required');
    document.getElementById('acompanhadoPor').removeAttribute('required');

    document.getElementById('modal').classList.add('active');
}

function fecharModal() {
    document.getElementById('modal').classList.remove('active');
    document.getElementById('maintenanceForm').reset();

    // Garantir que loading esteja oculto
    const modalLoading = document.getElementById('modalLoading');
    if (modalLoading) modalLoading.classList.remove('active');

    currentEditingRow = null;
}

function editarLinha(index) {
    currentEditingRow = index;
    const item = allData[index];

    console.log('=== EDITAR LINHA ===');
    console.log('Index:', index);
    console.log('Item:', item);

    document.getElementById('modalTitle').textContent = 'Editar Manutenção';

    // Preencher campos (readonly) - aceita nomes alternativos
    const razaoSocial = item.Razao_Social || item['Razao Social'] || item['Razão Social'] || item['Razão_Social'] || '';
    const cnpj = String(item.CNPJ || '');

    document.getElementById('razaoSocial').value = razaoSocial;
    document.getElementById('cnpj').value = formatarCNPJ(cnpj);
    document.getElementById('razaoSocial').readOnly = true;
    document.getElementById('cnpj').readOnly = true;

    // Preencher campo Técnico com usuário logado
    const loggedUser = localStorage.getItem('loggedUser') || sessionStorage.getItem('loggedUser');
    document.getElementById('tecnico').value = loggedUser || '';

    // Garantir que loading esteja oculto
    const modalLoading = document.getElementById('modalLoading');
    if (modalLoading) modalLoading.classList.remove('active');

    // Mostrar campos de edição
    document.getElementById('editFields').style.display = 'block';

    // Converter data para formato input date (YYYY-MM-DD)
    const dataAtendimento = item.Data_De_Atendimento || item['Data De Atendimento'] || item['Data_De_Atendimento'] || '';
    let dataInput = '';
    if (dataAtendimento) {
        // Se vier no formato DD/MM/YYYY, converter
        if (dataAtendimento.includes('/')) {
            const partes = dataAtendimento.split('/');
            if (partes.length === 3) {
                dataInput = `${partes[2]}-${partes[1]}-${partes[0]}`;
            }
        } else {
            // Se vier no formato ISO
            try {
                const data = new Date(dataAtendimento);
                const ano = data.getFullYear();
                const mes = String(data.getMonth() + 1).padStart(2, '0');
                const dia = String(data.getDate()).padStart(2, '0');
                dataInput = `${ano}-${mes}-${dia}`;
            } catch (e) {
                console.error('Erro ao converter data:', e);
            }
        }
    }

    const acompanhadoPor = item.Acompanhado_Por || item['Acompanhado Por'] || '';
    const observacoes = item.Observacoes || item['Observações'] || item['Observacoes'] || '';

    document.getElementById('dataAtendimento').value = dataInput;
    document.getElementById('acompanhadoPor').value = acompanhadoPor;
    document.getElementById('observacoes').value = observacoes;

    console.log('Campos preenchidos:', {
        razaoSocial,
        cnpj,
        tecnico: loggedUser,
        dataInput,
        acompanhadoPor
    });

    // Tornar campos obrigatórios
    document.getElementById('dataAtendimento').setAttribute('required', 'required');
    document.getElementById('acompanhadoPor').setAttribute('required', 'required');

    document.getElementById('modal').classList.add('active');
}

async function salvarDados() {
    // Rolar modal para o topo para garantir visibilidade do loading
    const modalContent = document.querySelector('.modal-content');
    if (modalContent) modalContent.scrollTop = 0;

    const razaoSocial = document.getElementById('razaoSocial').value.trim();
    const cnpj = document.getElementById('cnpj').value.trim();

    // Remover máscara do CNPJ
    const cnpjSemMascara = cnpj.replace(/\D/g, '');

    try {
        if (currentEditingRow === null) {
            // Nova empresa - POST para API de empresas
            console.log('Adicionando nova empresa...');

            const modalLoading = document.getElementById('modalLoading');
            modalLoading.classList.add('active');

            await adicionarEmpresa(formatarCNPJ(cnpjSemMascara), razaoSocial);

            modalLoading.classList.remove('active');

            alert('✅ Empresa cadastrada com sucesso!\n\nRazão Social: ' + razaoSocial + '\nCNPJ: ' + cnpj + '\n\nRecarregue a página para ver o novo registro.');

            fecharModal();

        } else {
            // Edição - POST para API de manutenções
            console.log('Atualizando manutenção...');

            const dataAtendimentoInput = document.getElementById('dataAtendimento').value;
            const acompanhadoPor = document.getElementById('acompanhadoPor').value.trim();
            const observacoes = document.getElementById('observacoes').value.trim();
            const tecnico = document.getElementById('tecnico').value.trim();

            // Converter data de YYYY-MM-DD para DD/MM/YYYY
            let dataFormatada = '';
            if (dataAtendimentoInput) {
                const partes = dataAtendimentoInput.split('-');
                dataFormatada = `${partes[2]}/${partes[1]}/${partes[0]}`;
            }

            const modalLoading = document.getElementById('modalLoading');
            modalLoading.classList.add('active');

            // Usar técnico (usuário logado) como Atendido_Por
            await atualizarManutencao(formatarCNPJ(cnpjSemMascara), tecnico, dataFormatada, acompanhadoPor, observacoes);

            modalLoading.classList.remove('active');

            alert('✅ Manutenção atualizada com sucesso!\n\nCNPJ: ' + cnpj + '\nTécnico: ' + tecnico + '\nData de Atendimento: ' + dataFormatada + '\nAcompanhado Por: ' + acompanhadoPor + '\nObservações: ' + observacoes + '\n\nRecarregando...');

            fecharModal();

            // Recarregar dados
            setTimeout(function () {
                window.location.reload();
            }, 1000);
        }

    } catch (error) {
        console.error('Erro ao salvar:', error);
        alert('❌ Erro ao salvar:\n\n' + error.message);

        const modalLoading = document.getElementById('modalLoading');
        if (modalLoading) modalLoading.classList.remove('active');

        const loading = document.getElementById('loadingIndicator');
        if (loading) loading.classList.remove('active');
    }
}
function podeEditar(item) {
    const loggedUser = localStorage.getItem('loggedUser') || sessionStorage.getItem('loggedUser');

    // Verificar perfil do usuário
    let userProfile = 'Técnico'; // Default assumes technician if info missing
    try {
        const userDataStr = sessionStorage.getItem('userData');
        if (userDataStr) {
            const userData = JSON.parse(userDataStr);
            if (userData.perfil) {
                userProfile = userData.perfil;
            }
        }
    } catch (e) {
        console.error('Erro ao ler perfil do usuário:', e);
    }

    // Normalizar perfil para comparação (remover acentos e lowercase)
    const perfilNormalizado = userProfile.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

    // Se NÃO for técnico, NÃO pode editar nada
    if (perfilNormalizado !== 'tecnico') {
        return false;
    }

    const dataAtendimento = item.Data_De_Atendimento || item['Data De Atendimento'] || item['Data_De_Atendimento'] || '';
    const atendidoPor = item.Atendido_Por || item['Atendido Por'] || '';

    // Se não tem data de atendimento, qualquer TÉCNICO pode editar
    if (!dataAtendimento || dataAtendimento.trim() === '') {
        return true;
    }

    // Se já foi atendida, apenas quem atendeu pode editar
    if (atendidoPor && atendidoPor.trim() !== '') {
        return atendidoPor === loggedUser;
    }

    // Caso não tenha atendido_por mas tenha data (edge case), permite editar
    return true;
}

// Fechar modal ao clicar fora
window.addEventListener('click', function (e) {
    const modal = document.getElementById('modal');
    if (e.target === modal) {
        fecharModal();
    }
});

// Expor funções globalmente
window.filtrarDados = filtrarDados;
window.editarLinha = editarLinha;
window.filterData = filtrarDados;
window.editRow = editarLinha;
// window.logout já foi exposto no início do arquivo
