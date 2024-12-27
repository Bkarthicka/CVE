document.addEventListener('DOMContentLoaded', () => {
    const cveDetailsDiv = document.getElementById('cve-details');

    function fetchCVEDetails(id) {
        fetch(`http://localhost:3000/api/fetchCVEDetails?id=${id}`)
            .then(response => {
                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }
                return response.json();
            })
            .then(cveData => {
                updateCVEDetails(cveData);
            })
            .catch(error => console.error('Error fetching CVE details:', error));
    }

    function updateCVEDetails(data) {

        const {
            _id: cveId,
            cve: {
                descriptions,
                metrics: { cvssMetricV2 },
                configurations,
            },
        } = data;

        const description = descriptions.find(desc => desc.lang === 'en')?.value || 'No description available.';

        const {
            cvssData: { baseScore, vectorString, accessVector, accessComplexity, authentication, confidentialityImpact, integrityImpact, availabilityImpact } = {},
            baseSeverity: severity,
            exploitabilityScore,
            impactScore,
        } = cvssMetricV2[0] || {};

        let cpeHtml = '';
        configurations.forEach(({ nodes }) => {
            nodes?.forEach(({ cpeMatch }) => {
                cpeMatch?.forEach(({ criteria, matchCriteriaId, vulnerable }) => {
                    cpeHtml += `
                        <tr>
                            <td>${criteria}</td>
                            <td>${matchCriteriaId}</td>
                            <td>${vulnerable}</td>
                        </tr>
                    `;
                });
            });
        });

        // Rendering the content
        cveDetailsDiv.innerHTML = `
            <h1>${cveId || 'CVE ID Not Available'}</h1>
            <h2>Description</h2>
            <p>${description}</p>

            <h2>CVSS V2 Metrics:</h2>
            <p><strong>Severity:</strong> ${severity}&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<strong>Score:</strong> ${baseScore}</p>
            <p><strong>Vector String:</strong> ${vectorString}</p>
            <table>
                <thead>
                    <tr>
                        <th>Access Vector</th>
                        <th>Access Complexity</th>
                        <th>Authentication</th>
                        <th>Confidentiality Impact</th>
                        <th>Integrity Impact</th>
                        <th>Availability Impact</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td>${accessVector}</td>
                        <td>${accessComplexity}</td>
                        <td>${authentication}</td>
                        <td>${confidentialityImpact}</td>
                        <td>${integrityImpact}</td>
                        <td>${availabilityImpact}</td>
                    </tr>
                </tbody>
            </table>

            <h2>Scores:</h2>
            <ul>
                <li><strong>Exploitability Score:</strong> ${exploitabilityScore}</li>
                <li><strong>Impact Score:</strong> ${impactScore}</li>
            </ul>

            <h2>CPE:</h2>
            <table>
                <thead>
                    <tr>
                        <th>Criteria</th>
                        <th>Match Criteria ID</th>
                        <th>Vulnerable</th>
                    </tr>
                </thead>
                <tbody>
                    ${cpeHtml || '<tr><td colspan="3">No CPE data available.</td></tr>'}
                </tbody>
            </table>
        `;
    }

    const urlParams = new URLSearchParams(window.location.search);
    const cveId = urlParams.get('id');
    if (cveId) {
        fetchCVEDetails(cveId);
    } else {
        cveDetailsDiv.innerHTML = '<p>Error: CVE ID not provided.</p>';
    }
});
