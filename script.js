document.addEventListener('DOMContentLoaded', () => {
    const tableBody = document.getElementById('cve-data-table');
    const pager = document.getElementById('pager');
    const resultsPerPageSelect = document.getElementById('results-per-page-select');
    let rowsPerPage = parseInt(resultsPerPageSelect.value);
    let currentPage = 1;

    function fetchAndUpdate(page, limit) {
        fetch(`http://localhost:3000/fetchData?page=${page}&limit=${limit}`)
            .then(response => {
                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }
                return response.json();
            })
            .then(responseData => {
                const totalRows = responseData.total;
                displayAndUpdate(responseData.data);
                updatePager(totalRows);
            })
            .catch(error => console.error('Error fetching data:', error));
    }

    function displayAndUpdate(data) {
        tableBody.innerHTML = '';
        data.forEach(cve => {
            const row = document.createElement('tr');
            row.classList.add('clickable');
            row.addEventListener('click', () => {
                if (cve && cve.cve && cve.cve.id) {
                    const detailsURL = `data.html?id=${cve.cve.id}`; 
                    window.location.href = detailsURL; 
                } else {
                    console.error('CVE ID not found in data:', cve);
                }
            });
            row.innerHTML = `
                <td>${cve.cve.id}</td>
                <td>${cve.cve.sourceIdentifier}</td>
                <td>${cve.cve.published.split('T')[0]}</td>
                <td>${cve.cve.lastModified.split('T')[0]}</td>
                <td>${cve.cve.vulnStatus}</td>
            `;
            tableBody.appendChild(row);
        });
    }


    function updatePager(totalRows) {
        pager.innerHTML = '';
        const totalPages = Math.ceil(totalRows / rowsPerPage);
        const startEntry = (currentPage - 1) * rowsPerPage + 1;
        const endEntry = Math.min(currentPage * rowsPerPage, totalRows);
        const totalEntriesElement = document.getElementById('total-entries');
        totalEntriesElement.textContent = `${startEntry}-${endEntry} of ${totalRows}`;
        let startPage = Math.max(1, currentPage - 2);
        let endPage = Math.min(startPage + 4, totalPages);
        if (endPage - startPage < 4) {
            startPage = Math.max(1, endPage - 4);
        }
        const prevBtn = document.createElement('button');
        prevBtn.textContent = '<';
        prevBtn.addEventListener('click', () => {
            if (currentPage > 1) {
                currentPage--;
                fetchAndUpdate(currentPage, rowsPerPage);
            }
        });
        pager.appendChild(prevBtn);

        for (let i = startPage; i <= endPage; i++) {
            const btn = document.createElement('button');
            btn.textContent = i;
            btn.addEventListener('click', () => {
                currentPage = i;
                fetchAndUpdate(currentPage, rowsPerPage);
            });
            if (i === currentPage) {
                btn.disabled = true;
                btn.style.backgroundColor = '#ddd';
            }
            pager.appendChild(btn);
        }
        const nextBtn = document.createElement('button');
        nextBtn.textContent = '>';
        nextBtn.addEventListener('click', () => {
            if (currentPage < totalPages) {
                currentPage++;
                fetchAndUpdate(currentPage, rowsPerPage);
            }
        });
        pager.appendChild(nextBtn);
    }

    resultsPerPageSelect.addEventListener('change', () => {
        rowsPerPage = parseInt(resultsPerPageSelect.value);
        currentPage = 1;
        fetchAndUpdate(currentPage, rowsPerPage);
    });

    fetchAndUpdate(currentPage, rowsPerPage);
});
