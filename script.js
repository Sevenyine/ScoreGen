document.addEventListener("DOMContentLoaded", function() {
    const schools = [
        "北京市第十九中学",
        "北京市中关村中学",
        "BLC",
        "RDL",
        "北京市第八中学",
        "DioDa",
        "ZX",
        "Wave",
        "OvO",
        "中国人民大学附属中学",
        "清纯白毛小萝莉队",
        "北京卫生职业学院",
        "北京市和平街第一中学",
        "北京市三里屯一中",
        "北京师范大学实验中学丰台学校",
        "北京市第三十五中学",
        "清华附中朝阳学校",
        "北京师范大学附属实验中学",
        "北京教师进修学校附属实验学校",
        "北京交通大学附属中学第二分校",
        "北大附中朝阳未来学校",
        "清华大学附属学校将台路校区",
        "北京市第十二中学",
        "清华大学附属中学",
        "北京化工大学附属中学",
        "北京师范大学燕化附属中学",
        "潞河中学",
        "北京市密云区第二中学",
        "北京市第二中学通州校区",
        "北京市人民大学附属中学第二分校",
        "北京信息管理学校中关村校区",
        "北京市第十八中学",
        "不可一世的赌徒",
        "北京市第二十二中学",
        "北京市建华实验亦庄学校",
        "QAQ"
    ];

    const homeTeamSelect = document.getElementById('home-team');
    const awayTeamSelect = document.getElementById('away-team');

    // 初始化下拉框
    function populateSelectOptions(selectElement, options) {
        options.forEach(school => {
            const option = document.createElement('option');
            option.value = school;
            option.textContent = school;
            selectElement.appendChild(option);
        });
    }

    populateSelectOptions(homeTeamSelect, schools);

    // 更新客场队伍选项
    homeTeamSelect.addEventListener('change', function() {
        awayTeamSelect.innerHTML = '<option value="" disabled selected>请选择学校</option>';
        awayTeamSelect.disabled = false;

        const selectedSchool = homeTeamSelect.value;
        const availableSchools = schools.filter(school => school !== selectedSchool);
        populateSelectOptions(awayTeamSelect, availableSchools);
    });

    document.getElementById('next-button').addEventListener('click', function() {
        const homeTeam = homeTeamSelect.value;
        const awayTeam = awayTeamSelect.value;

        if (homeTeam && awayTeam) {
            document.getElementById('input-stage').style.display = 'none';
            document.getElementById('output-stage').style.display = 'block';
            document.getElementById('match-title').textContent = `${homeTeam} vs ${awayTeam}`;
            createBO('bo1', homeTeam, awayTeam);
            createBO('bo2', homeTeam, awayTeam);
            document.getElementById('add-bo').style.display = 'block';
            saveData();
        } else {
            alert('请填写所有队伍名称');
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
        const awayTeam = data.awayTeam;
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

        // Trigger change events to update the UI
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

        // Trigger change events to update the UI
        role1Select.dispatchEvent(new Event('change'));
        result1Select.dispatchEvent(new Event('change'));
        time1Input.dispatchEvent(new Event('input'));
        role2Select.dispatchEvent(new Event('change'));
        result2Select.dispatchEvent(new Event('change'));
        time2Input.dispatchEvent(new Event('input'));
    }
}

// 监听用户更改选择事件，保存数据
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
            document.querySelector(`span[data-id="${resultId}"]`).textContent = `${scoreResult} (${seconds})`;
        }
    });

    updateTableResults();
}

function formatTimeToSeconds(time) {
    if (time.includes(':')) {
        const [minutes, seconds] = time.split(':').map(Number);
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
