document.addEventListener('DOMContentLoaded', () => {
    const assignmentsList = document.getElementById('assignmentsList');
    const gradeBtn = document.getElementById('gradeBtn');
    const studentUrlInput = document.getElementById('studentUrl');
    const backendUrlInput = document.getElementById('backendUrl');
    const resultSection = document.getElementById('resultSection');
    const statusMessage = document.getElementById('statusMessage');
    const reportLink = document.getElementById('reportLink');
    const consoleOutput = document.getElementById('consoleOutput');
    const btnText = document.getElementById('btnText');
    const btnIcon = document.getElementById('btnIcon');
    const btnSpinner = document.getElementById('btnSpinner');

    let selectedAssignment = null;

    // Fetch assignments
    fetch('/api/assignments')
        .then(res => res.json())
        .then(assignments => {
            assignmentsList.innerHTML = '';
            if (assignments.length === 0) {
                assignmentsList.innerHTML = '<div class="col-span-full text-center text-gray-500">No assignments found in tests/generated/</div>';
                return;
            }

            assignments.forEach(assignment => {
                const card = document.createElement('div');
                card.className = 'border rounded-md p-4 cursor-pointer hover:bg-blue-50 transition duration-200 flex items-center justify-between assignment-card';
                card.dataset.id = assignment.id;
                card.onclick = () => selectAssignment(assignment.id, card);
                
                card.innerHTML = `
                    <span class="font-medium text-gray-800">${assignment.name}</span>
                    <i class="fas fa-check-circle text-blue-600 hidden check-icon"></i>
                `;
                assignmentsList.appendChild(card);
            });
        })
        .catch(err => {
            console.error(err);
            assignmentsList.innerHTML = '<div class="text-red-500">Failed to load assignments.</div>';
        });

    function selectAssignment(id, cardElement) {
        selectedAssignment = id;
        
        // Update UI
        document.querySelectorAll('.assignment-card').forEach(el => {
            el.classList.remove('ring-2', 'ring-blue-500', 'bg-blue-50');
            el.querySelector('.check-icon').classList.add('hidden');
        });

        cardElement.classList.add('ring-2', 'ring-blue-500', 'bg-blue-50');
        cardElement.querySelector('.check-icon').classList.remove('hidden');
    }

    gradeBtn.addEventListener('click', async () => {
        const studentUrl = studentUrlInput.value.trim();
        const backendUrl = backendUrlInput.value.trim();
        const mode = document.querySelector('input[name="mode"]:checked').value;

        if (!studentUrl) {
            alert('Please enter the Frontend URL.');
            studentUrlInput.focus();
            return;
        }

        if (!selectedAssignment) {
            alert('Please select an assignment to grade.');
            return;
        }

        // Set Loading State
        setLoading(true);
        resultSection.classList.add('hidden');

        try {
            const response = await fetch('/api/grade', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    assignment: selectedAssignment,
                    studentUrl,
                    backendUrl,
                    mode
                })
            });

            const result = await response.json();

            // Show Results
            resultSection.classList.remove('hidden');
            if (result.success) {
                statusMessage.className = 'p-4 rounded-md mb-4 text-center font-medium bg-green-100 text-green-800';
                statusMessage.innerHTML = '<i class="fas fa-check-circle mr-2"></i> Grading Passed!';
            } else {
                statusMessage.className = 'p-4 rounded-md mb-4 text-center font-medium bg-red-100 text-red-800';
                statusMessage.innerHTML = '<i class="fas fa-times-circle mr-2"></i> Grading Failed. Check report for details.';
            }

            reportLink.href = result.reportUrl;
            consoleOutput.textContent = (result.output || '') + '\n' + (result.error || '');
            
            // Scroll to results
            resultSection.scrollIntoView({ behavior: 'smooth' });

        } catch (error) {
            console.error(error);
            alert('An error occurred while grading.');
        } finally {
            setLoading(false);
        }
    });

    function setLoading(isLoading) {
        gradeBtn.disabled = isLoading;
        if (isLoading) {
            btnText.textContent = 'Grading in Progress...';
            btnIcon.classList.add('hidden');
            btnSpinner.classList.remove('hidden');
        } else {
            btnText.textContent = 'Grade Assignment';
            btnIcon.classList.remove('hidden');
            btnSpinner.classList.add('hidden');
        }
    }
});
