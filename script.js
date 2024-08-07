document.addEventListener("DOMContentLoaded", function() {
    fetch('https://gen.cdsv.cc/data/schools-data.xlsx')
    .then(response => response.arrayBuffer())
    .then(data => {
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const excelData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
        
        // 填充学校下拉列表
        populateSelectOptions(excelData);

        document.getElementById('next-button').addEventListener('click', function() {
            const homeTeam = document.getElementById('home-team').value;
            const awayTeam = document.getElementById('away-team').value;

            if (homeTeam && awayTeam) {
                const filteredData = filterData(excelData, homeTeam, awayTeam);
                displayFormattedData(filteredData);
            } else {
                alert('请选择队伍');
            }
        });
    });

    function populateSelectOptions(data) {
        const homeTeamSelect = document.getElementById('home-team');
        const awayTeamSelect = document.getElementById('away-team');

        const schools = new Set(data.slice(2).map(row => row[0])); // 从第三行开始，获取所有学校名称

        schools.forEach(school => {
            const option1 = document.createElement('option');
            option1.value = school;
            option1.textContent = school;
            homeTeamSelect.appendChild(option1);

            const option2 = document.createElement('option');
            option2.value = school;
            option2.textContent = school;
            awayTeamSelect.appendChild(option2);
        });
    }

    function filterData(data, homeTeam, awayTeam) {
        const filteredData = data.filter(row => row[0] === homeTeam || row[0] === awayTeam);
        return filteredData;
    }

    function displayFormattedData(filteredData) {
        let output = "";

        const categories = filteredData[0]; // 第一行是大分类
        const subcategories = filteredData[1]; // 第二行是小分类

        filteredData.slice(2).forEach((row, index) => {
            output += `## ${categories[0]} ${index + 1}:\n`; // 大分类名加序号
            subcategories.forEach((subcategory, idx) => {
                output += `### ${subcategory}: ${row[idx]}\n`; // 小分类及其对应的内容
            });
            output += "\n";
        });

        document.getElementById('filtered-data').innerHTML = output;
        document.getElementById('output-stage').style.display = 'block';
    }
    
    document.getElementById('generate-hash').addEventListener('click', function() {
        const results = collectResults();
        if (results) {
            const hash = CryptoJS.SHA256(results).toString(CryptoJS.enc.Hex);
            displayHash(hash);
        } else {
            alert('没有找到任何比赛结果数据。');
        }
    });

    function collectResults() {
        let resultString = '';

        const homeTeam = document.getElementById('home-team').value;
        const awayTeam = document.getElementById('away-team').value;

        resultString += `${homeTeam} vs ${awayTeam};`;

        for (let i = 1; i <= 3; i++) {
            const result1 = document.getElementById(`bo${i}-result1`);
            const result2 = document.getElementById(`bo${i}-result2`);

            if (result1 && result1.style.display !== 'none') {
                resultString += result1.textContent.trim() + ';';
            }
            if (result2 && result2.style.display !== 'none') {
                resultString += result2.textContent.trim() + ';';
            }
        }

        const tiebreakerResult1 = document.getElementById('tiebreaker-result1');
        const tiebreakerResult2 = document.getElementById('tiebreaker-result2');

        if (tiebreakerResult1 && tiebreakerResult1.style.display !== 'none') {
            resultString += tiebreakerResult1.textContent.trim() + ';';
        }
        if (tiebreakerResult2 && tiebreakerResult2.style.display !== 'none') {
            resultString += tiebreakerResult2.textContent.trim() + ';';
        }

        return resultString;
    }

    function displayHash(hash) {
        document.getElementById('hash-value').textContent = hash;
        document.getElementById('hash-output').style.display = 'block';
    }

    const homeTeamSelect = document.getElementById('home-team');
    const awayTeamSelect = document.getElementById('away-team');

    document.getElementById('next-button').addEventListener('click', function() {
        const homeTeam = homeTeamSelect.value;
        const awayTeam = awayTeamSelect.value;
    
        if (homeTeam && awayTeam) {
            document.getElementById('input-stage').style.display = 'none';
            document.getElementById('output-stage').style.display = 'block';
            document.getElementById('match-title').textContent = `${homeTeam} vs ${awayTeam}`;
            document.getElementById('match-instructions').style.display = 'block';
            createBO('bo1', homeTeam, awayTeam);
            createBO('bo2', homeTeam, awayTeam);
            document.getElementById('add-bo').style.display = 'block';
            saveData();
        } else {
            alert('请选择队伍');
        }
    });
    

    document.getElementById('restore-button').addEventListener('click', restoreData);
});

let boCount = 2;

document.getElementById('add-bo').addEventListener('click', function() {
    boCount++;
    createBO(`bo${boCount}`, document.getElementById('home-team').value, document.getElementById('away-team').value);
    document.getElementById(`bo${boCount}-header`).style.display = 'table-cell';
    document.getElementById(`bo${boCount}-result1`).style.display = 'table-cell';
    document.getElementById(`bo${boCount}-result2`).style.display = 'table-cell';
    if (boCount === 3) {
        document.getElementById('add-bo').style.display = 'none';
        document.getElementById('add-tiebreaker').style.display = 'block';
    }
    saveData();
});

document.getElementById('add-tiebreaker').addEventListener('click', function() {
    createTiebreaker(document.getElementById('home-team').value, document.getElementById('away-team').value);
    document.getElementById('tiebreaker-header').style.display = 'table-cell';
    document.getElementById('tiebreaker-result1').style.display = 'table-cell';
    document.getElementById('tiebreaker-result2').style.display = 'table-cell';
    document.getElementById('add-tiebreaker').style.display = 'none';
    saveData();
});

function restoreData() {
    const savedData = localStorage.getItem('matchData');
    if (savedData) {
        const data = JSON.parse(savedData);
        console.log('Restoring data:', data);
        document.getElementById('home-team').value = data.homeTeam;
        document.getElementById('away-team').value = data.awayTeam;
        document.getElementById('next-button').click();
        setTimeout(() => {
            loadSavedData(data);
            displayRestoredData(data);
        }, 100);
    } else {
        alert('没有找到任何保存的数据。');
    }
}

function saveData() {
    const matchData = {
        homeTeam: document.getElementById('home-team').value,
        awayTeam: document.getElementById('away-team').value,
        bos: [],
        tiebreaker: null,
    };

    const boDivs = document.querySelectorAll('[id^=bo]');
    boDivs.forEach(boDiv => {
        const boId = boDiv.id;
        const role1 = document.querySelector(`select[data-result-id="${boId}-result1"]`);
        const result1 = document.querySelector(`select[data-id="${boId}-result1-home"]`);
        const role2 = document.querySelector(`select[data-result-id="${boId}-result2"]`);
        const result2 = document.querySelector(`select[data-id="${boId}-result2-home"]`);

        if (role1 && result1 && role2 && result2) {
            matchData.bos.push({
                boId,
                role1: role1.value,
                result1: result1.value,
                role2: role2.value,
                result2: result2.value
            });
        } else {
            console.error(`Elements not found for ${boId}`);
        }
    });

    const tiebreakerDiv = document.getElementById('tiebreaker');
    if (tiebreakerDiv) {
        const role1 = document.querySelector(`select[data-result-id="tiebreaker-result1"]`);
        const result1 = document.querySelector(`select[data-id="tiebreaker-result1-home"]`);
        const time1 = document.querySelector(`input[data-id="tiebreaker-result1-time"]`);
        const role2 = document.querySelector(`select[data-result-id="tiebreaker-result2"]`);
        const result2 = document.querySelector(`select[data-id="tiebreaker-result2-home"]`);
        const time2 = document.querySelector(`input[data-id="tiebreaker-result2-time"]`);

        if (role1 && result1 && time1 && role2 && result2 && time2) {
            matchData.tiebreaker = {
                role1: role1.value,
                result1: result1.value,
                time1: time1.value,
                role2: role2.value,
                result2: result2.value,
                time2: time2.value
            };
        } else {
            console.error('Elements not found for tiebreaker');
        }
    }

    localStorage.setItem('matchData', JSON.stringify(matchData));
    console.log('Data saved:', matchData);
    clearHash();
}

function loadSavedData(data) {
    data.bos.forEach(bo => {
        setBOData(bo.boId, bo.role1, bo.result1, bo.role2, bo.result2);
    });

    if (data.tiebreaker) {
        setTiebreakerData(
            data.tiebreaker.role1,
            data.tiebreaker.result1,
            data.tiebreaker.time1,
            data.tiebreaker.role2,
            data.tiebreaker.result2,
            data.tiebreaker.time2
        );
    }

    updateResults();
}

function displayRestoredData(data) {
    let restoredDataContent = '';

    data.bos.forEach(bo => {
        const homeTeam = data.homeTeam;
        restoredDataContent += `${bo.boId.toUpperCase()} 上半:\n`;
        restoredDataContent += `${homeTeam}（${bo.role1}）结果（${bo.result1}）\n`;
        restoredDataContent += `${bo.boId.toUpperCase()} 下半:\n`;
        restoredDataContent += `${homeTeam}（${bo.role2}）结果（${bo.result2}）\n\n`;
    });

    if (data.tiebreaker) {
        restoredDataContent += `加赛:\n`;
        restoredDataContent += `${data.homeTeam}（${data.tiebreaker.role1}）用了${data.tiebreaker.time1}秒结果（${data.tiebreaker.result1}）\n`;
        restoredDataContent += `${data.homeTeam}（${data.tiebreaker.role2}）用了${data.tiebreaker.time2}秒结果（${data.tiebreaker.result2}）\n`;
    }

    document.getElementById('restored-data-content').textContent = restoredDataContent;
    document.getElementById('restored-data').style.display = 'block';
}

function setBOData(boId, role1, result1, role2, result2) {
    const role1Select = document.querySelector(`select[data-result-id="${boId}-result1"]`);
    const result1Select = document.querySelector(`select[data-id="${boId}-result1-home"]`);
    const role2Select = document.querySelector(`select[data-result-id="${boId}-result2"]`);
    const result2Select = document.querySelector(`select[data-id="${boId}-result2-home"]`);

    if (role1Select && result1Select && role2Select && result2Select) {
        role1Select.value = role1;
        updateScoreOptions(result1Select, role1);
        result1Select.value = result1;

        role2Select.value = role2;
        updateScoreOptions(result2Select, role2);
        result2Select.value = result2;

        role1Select.dispatchEvent(new Event('change'));
        result1Select.dispatchEvent(new Event('change'));
        role2Select.dispatchEvent(new Event('change'));
        result2Select.dispatchEvent(new Event('change'));
    }
}

function setTiebreakerData(role1, result1, time1, role2, result2, time2) {
    const role1Select = document.querySelector(`select[data-result-id="tiebreaker-result1"]`);
    const result1Select = document.querySelector(`select[data-id="tiebreaker-result1-home"]`);
    const time1Input = document.querySelector(`input[data-id="tiebreaker-result1-time"]`);
    const role2Select = document.querySelector(`select[data-result-id="tiebreaker-result2"]`);
    const result2Select = document.querySelector(`select[data-id="tiebreaker-result2-home"]`);
    const time2Input = document.querySelector(`input[data-id="tiebreaker-result2-time"]`);

    if (role1Select && result1Select && time1Input && role2Select && result2Select && time2Input) {
        role1Select.value = role1;
        updateScoreOptions(result1Select, role1);
        result1Select.value = result1;
        time1Input.value = time1;

        role2Select.value = role2;
        updateScoreOptions(result2Select, role2);
        result2Select.value = result2;
        time2Input.value = time2;

        role1Select.dispatchEvent(new Event('change'));
        result1Select.dispatchEvent(new Event('change'));
        time1Input.dispatchEvent(new Event('input'));
        role2Select.dispatchEvent(new Event('change'));
        result2Select.dispatchEvent(new Event('change'));
        time2Input.dispatchEvent(new Event('input'));
    }
}

document.addEventListener('change', function(e) {
    if (e.target && (e.target.classList.contains('role-select') || e.target.classList.contains('score-select') || e.target.classList.contains('time-input'))) {
        saveData();
    }
});

function createBO(id, homeTeam, awayTeam) {
    const boDiv = document.createElement('div');
    boDiv.id = id;
    boDiv.innerHTML = `
        <h3>${id.toUpperCase()}</h3>
        <div>
            ${homeTeam}（<select class="role-select" data-home-team="${homeTeam}" data-away-team="${awayTeam}" data-result-id="${id}-result1">
                <option value="未选择">未选择</option>
                <option value="监管">监管</option>
                <option value="求生">求生</option>
            </select>）
            游戏结果：<select class="score-select" data-id="${id}-result1-home"></select>
        </div>
        <div>
            <strong>${id.toUpperCase()} 上半：</strong>${homeTeam}（<span class="role-display" data-id="${id}-result1-role"></span>）<span class="score-display" data-id="${id}-result1-home-display"></span>，
            ${homeTeam}积<span class="score-points" data-id="${id}-result1-home-points"></span>分，${awayTeam}积<span class="score-points" data-id="${id}-result1-away-points"></span>分。
            <br>比分为：<span class="score-result" data-id="${id}-result1"></span>。
        </div>
        <div>
            ${homeTeam}（<select class="role-select" data-home-team="${homeTeam}" data-away-team="${awayTeam}" data-result-id="${id}-result2">
                <option value="未选择">未选择</option>
                <option value="求生">求生</option>
                <option value="监管">监管</option>
            </select>）
            游戏结果：<select class="score-select" data-id="${id}-result2-home"></select>
        </div>
        <div>
            <strong>${id.toUpperCase()} 下半：</strong>${homeTeam}（<span class="role-display" data-id="${id}-result2-role"></span>）<span class="score-display" data-id="${id}-result2-home-display"></span>，
            ${homeTeam}积<span class="score-points" data-id="${id}-result2-home-points"></span>分，${awayTeam}积<span class="score-points" data-id="${id}-result2-away-points"></span>分。
            <br>比分为：<span class="score-result" data-id="${id}-result2"></span>。
        </div>
    `;
    document.getElementById('matches').appendChild(boDiv);

    const selects = boDiv.getElementsByClassName('role-select');
    Array.from(selects).forEach((select, index) => {
        select.addEventListener('change', function() {
            const role = select.value;
            const scoreSelect = document.querySelector(`select[data-id="${select.getAttribute('data-result-id')}-home"]`);
            updateScoreOptions(scoreSelect, role);

            const roleDisplay = document.querySelector(`span[data-id="${select.getAttribute('data-result-id')}-role"]`);
            roleDisplay.textContent = role;

            const nextSelect = selects[(index + 1) % 2];
            nextSelect.value = role === '监管' ? '求生' : '监管';
            const nextScoreSelect = document.querySelector(`select[data-id="${nextSelect.getAttribute('data-result-id')}-home"]`);
            updateScoreOptions(nextScoreSelect, nextSelect.value);

            const nextRoleDisplay = document.querySelector(`span[data-id="${nextSelect.getAttribute('data-result-id')}-role"]`);
            nextRoleDisplay.textContent = nextSelect.value;

            updateResults();
        });

        updateScoreOptions(document.querySelector(`select[data-id="${select.getAttribute('data-result-id')}-home"]`), select.value);
        document.querySelector(`span[data-id="${select.getAttribute('data-result-id')}-role"]`).textContent = select.value;
    });

    const inputs = boDiv.getElementsByClassName('score-select');
    Array.from(inputs).forEach(input => {
        input.addEventListener('change', updateResults);
    });
}

function createTiebreaker(homeTeam, awayTeam) {
    const tiebreakerDiv = document.createElement('div');
    tiebreakerDiv.id = 'tiebreaker';
    tiebreakerDiv.innerHTML = `
        <h3>加赛</h3>
        <div>
            ${homeTeam}（<select class="role-select" data-home-team="${homeTeam}" data-away-team="${awayTeam}" data-result-id="tiebreaker-result1">
                <option value="未选择">未选择</option>
                <option value="监管">监管</option>
                <option value="求生">求生</option>
            </select>）
            游戏结果：<select class="score-select" data-id="tiebreaker-result1-home"></select>
            <input type="text" class="time-input" placeholder="比赛时间" data-id="tiebreaker-result1-time">
        </div>
        <div>
            <strong>加赛：</strong>${homeTeam}（<span class="role-display" data-id="tiebreaker-result1-role"></span>）用了<span class="time-display" data-id="tiebreaker-result1-time-display"></span><span class="score-display" data-id="tiebreaker-result1-home-display"></span>，
            ${homeTeam}积<span class="score-points" data-id="tiebreaker-result1-home-points"></span>分，${awayTeam}积<span class="score-points" data-id="tiebreaker-result1-away-points"></span>分。
            <br>比分为：<span class="score-result" data-id="tiebreaker-result1"></span>。
        </div>
        <div>
            ${homeTeam}（<select class="role-select" data-home-team="${homeTeam}" data-away-team="${awayTeam}" data-result-id="tiebreaker-result2">
                <option value="未选择">未选择</option>
                <option value="求生">求生</option>
                <option value="监管">监管</option>
            </select>）
            游戏结果：<select class="score-select" data-id="tiebreaker-result2-home"></select>
            <input type="text" class="time-input" placeholder="比赛时间" data-id="tiebreaker-result2-time">
        </div>
        <div>
            <strong>加赛：</strong>${homeTeam}（<span class="role-display" data-id="tiebreaker-result2-role"></span>）用了<span class="time-display" data-id="tiebreaker-result2-time-display"></span><span class="score-display" data-id="tiebreaker-result2-home-display"></span>，
            ${homeTeam}积<span class="score-points" data-id="tiebreaker-result2-home-points"></span>分，${awayTeam}积<span class="score-points" data-id="tiebreaker-result2-away-points"></span>分。
            <br>比分为：<span class="score-result" data-id="tiebreaker-result2"></span>。
        </div>
    `;
    document.getElementById('matches').appendChild(tiebreakerDiv);

    const selects = tiebreakerDiv.getElementsByClassName('role-select');
    Array.from(selects).forEach((select, index) => {
        select.addEventListener('change', function() {
            const role = select.value;
            const scoreSelect = document.querySelector(`select[data-id="${select.getAttribute('data-result-id')}-home"]`);
            updateScoreOptions(scoreSelect, role);

            const roleDisplay = document.querySelector(`span[data-id="${select.getAttribute('data-result-id')}-role"]`);
            roleDisplay.textContent = role;

            const nextSelect = selects[(index + 1) % 2];
            nextSelect.value = role === '监管' ? '求生' : '监管';
            const nextScoreSelect = document.querySelector(`select[data-id="${nextSelect.getAttribute('data-result-id')}-home"]`);
            updateScoreOptions(nextScoreSelect, nextSelect.value);

            const nextRoleDisplay = document.querySelector(`span[data-id="${nextSelect.getAttribute('data-result-id')}-role"]`);
            nextRoleDisplay.textContent = nextSelect.value;

            updateResults();
        });

        updateScoreOptions(document.querySelector(`select[data-id="${select.getAttribute('data-result-id')}-home"]`), select.value);
        document.querySelector(`span[data-id="${select.getAttribute('data-result-id')}-role"]`).textContent = select.value;
    });

    const inputs = tiebreakerDiv.getElementsByClassName('score-select');
    Array.from(inputs).forEach(input => {
        input.addEventListener('change', updateResults);
    });

    const timeInputs = tiebreakerDiv.getElementsByClassName('time-input');
    Array.from(timeInputs).forEach(input => {
        input.addEventListener('input', updateResults);
    });
}

function updateScoreOptions(scoreSelect, role) {
    scoreSelect.innerHTML = '<option value="未选择">未选择</option>';
    if (role === '监管') {
        scoreSelect.innerHTML += `
            <option value="4">四杀</option>
            <option value="3">三杀</option>
            <option value="2">平局</option>
            <option value="1">一杀</option>
            <option value="0">零杀</option>
        `;
    } else if (role === '求生') {
        scoreSelect.innerHTML += `
            <option value="4">四跑</option>
            <option value="3">三跑</option>
            <option value="2">平局</option>
            <option value="1">一跑</option>
            <option value="0">零跑</option>
        `;
    }
}

function updateResults() {
    const selects = document.getElementsByClassName('role-select');
    Array.from(selects).forEach(select => {
        const resultId = select.getAttribute('data-result-id');
        const homeScoreOption = document.querySelector(`select[data-id="${resultId}-home"]`).value;
        const role = select.value;

        let homeScore, awayScore;

        if (role === '未选择' || homeScoreOption === '未选择') {
            document.querySelector(`span[data-id="${resultId}-home-display"]`).textContent = '';
            document.querySelector(`span[data-id="${resultId}-home-points"]`).textContent = '';
            document.querySelector(`span[data-id="${resultId}-away-points"]`).textContent = '';
            document.querySelector(`span[data-id="${resultId}-role"]`).textContent = '';
            document.querySelector(`span[data-id="${resultId}"]`).textContent = '比赛结果尚未填写。';
        } else if (role === '监管') {
            switch (homeScoreOption) {
                case '4':
                    homeScore = 5;
                    awayScore = 0;
                    break;
                case '3':
                    homeScore = 3;
                    awayScore = 1;
                    break;
                case '2':
                    homeScore = 2;
                    awayScore = 2;
                    break;
                case '1':
                    homeScore = 1;
                    awayScore = 3;
                    break;
                case '0':
                    homeScore = 0;
                    awayScore = 5;
                    break;
            }
            document.querySelector(`span[data-id="${resultId}-home-display"]`).textContent = `${homeScoreOption}杀`;
            document.querySelector(`span[data-id="${resultId}-home-points"]`).textContent = homeScore;
            document.querySelector(`span[data-id="${resultId}-away-points"]`).textContent = awayScore;
            document.querySelector(`span[data-id="${resultId}-role"]`).textContent = role;
            document.querySelector(`span[data-id="${resultId}"]`).textContent = `${homeScore}:${awayScore}`;
        } else {
            switch (homeScoreOption) {
                case '4':
                    homeScore = 5;
                    awayScore = 0;
                    break;
                case '3':
                    homeScore = 3;
                    awayScore = 1;
                    break;
                case '2':
                    homeScore = 2;
                    awayScore = 2;
                    break;
                case '1':
                    homeScore = 1;
                    awayScore = 3;
                    break;
                case '0':
                    homeScore = 0;
                    awayScore = 5;
                    break;
            }
            document.querySelector(`span[data-id="${resultId}-home-display"]`).textContent = `${homeScoreOption}跑`;
            document.querySelector(`span[data-id="${resultId}-home-points"]`).textContent = homeScore;
            document.querySelector(`span[data-id="${resultId}-away-points"]`).textContent = awayScore;
            document.querySelector(`span[data-id="${resultId}-role"]`).textContent = role;
            document.querySelector(`span[data-id="${resultId}"]`).textContent = `${homeScore}-${awayScore}`;
        }
    });

    const timeInputs = document.getElementsByClassName('time-input');
    Array.from(timeInputs).forEach(input => {
        const resultId = input.getAttribute('data-id').replace('-time', '');
        const time = input.value;
        if (time) {
            const seconds = formatTimeToSeconds(time);
            document.querySelector(`span[data-id="${resultId}-time-display"]`).textContent = `${seconds}秒`;
            const scoreResult = document.querySelector(`span[data-id="${resultId}"]`).textContent;
            document.querySelector(`span[data-id="${resultId}"]`).textContent = `${scoreResult}(${seconds})`;
        }
    });

    updateTableResults();
    clearHash();
}

function clearHash() {
    const hashOutput = document.getElementById('hash-output');
    const hashValue = document.getElementById('hash-value');

    if (hashOutput.style.display !== 'none') {
        hashValue.textContent = '数据已更改，请重新生成哈希。';
        hashOutput.style.display = 'block';
    }
}

function formatTimeToSeconds(time) {
    const timeParts = time.split(/[:：]/);
    
    if (timeParts.length === 2) {
        const [minutes, seconds] = timeParts.map(Number);
        return minutes * 60 + seconds;
    } else {
        return Number(time);
    }
}


function updateTableResults() {
    const bo1Result1 = document.querySelector('span[data-id="bo1-result1"]').textContent;
    const bo1Result2 = document.querySelector('span[data-id="bo1-result2"]').textContent;
    const bo2Result1 = document.querySelector('span[data-id="bo2-result1"]').textContent;
    const bo2Result2 = document.querySelector('span[data-id="bo2-result2"]').textContent;
    const bo3Result1 = document.querySelector('span[data-id="bo3-result1"]')?.textContent || '';
    const bo3Result2 = document.querySelector('span[data-id="bo3-result2"]')?.textContent || '';
    const tiebreakerResult1 = document.querySelector('span[data-id="tiebreaker-result1"]')?.textContent || '';
    const tiebreakerResult2 = document.querySelector('span[data-id="tiebreaker-result2"]')?.textContent || '';

    document.getElementById('bo1-result1').textContent = bo1Result1;
    document.getElementById('bo1-result2').textContent = bo1Result2;
    document.getElementById('bo2-result1').textContent = bo2Result1;
    document.getElementById('bo2-result2').textContent = bo2Result2;
    if (bo3Result1 && bo3Result2) {
        document.getElementById('bo3-result1').textContent = bo3Result1;
        document.getElementById('bo3-result2').textContent = bo3Result2;
    }
    if (tiebreakerResult1 && tiebreakerResult2) {
        document.getElementById('tiebreaker-result1').textContent = tiebreakerResult1;
        document.getElementById('tiebreaker-result2').textContent = tiebreakerResult2;
    }
}
