const resultsDiv = document.querySelector('#results');
const loadingDiv = document.querySelector('#loading');
const statisticsDiv = document.querySelector('#statistics');
const seedInput = document.querySelector('#seed_input');
const usBlockHashCheckbox = document.querySelector('#use_stake_us_block_hash');
const updateButton = document.querySelector('#update_button');
const crashesCount = document.querySelector('#crashes_count');

const blockHash = '0000000000000000001b34dc6a1e86083f95500b096231436e9b25cbdd0075c4';
const usBlockHash = '000000000000000000066448f2f56069750fc40c718322766b6bdf63fdcf45b8';

const amountInput = document.querySelector('#amount_input');
const goodValueInput = document.querySelector('#good_value_input');

// loading values.
amountInput.value = localStorage.getItem('amount') ?? 100;
goodValueInput.value = localStorage.getItem('goodValue') ?? 2;
usBlockHashCheckbox.checked = localStorage.getItem('usBlockHash') == 'true';

let timeout = null;

seedInput.addEventListener('keyup', (ev) => {
	if (ev.key == 'Enter') {
		ev.preventDefault();

		OnInputChange();
	}
});

$(resultsDiv).selectable({
	stop: UpdateSelectionWindow,
});

seedInput.addEventListener('input', (ev) => {
	OnInputChange();
});
amountInput.addEventListener('input', (ev) => {
	OnInputChange();

	const amount = parseInt(amountInput.value);

	if (isNaN(amount)) return;
	localStorage.setItem('amount', amount);
});
goodValueInput.addEventListener('input', (ev) => {
	OnInputChange();

	const goodValue = parseFloat(goodValueInput.value);

	if (isNaN(goodValue)) return;
	localStorage.setItem('goodValue', goodValue);
});
usBlockHashCheckbox.addEventListener('change', (ev) => {
	OnInputChange();

	localStorage.setItem('usBlockHash', usBlockHashCheckbox.checked);
});

updateButton.addEventListener('click', (ev) => {
	OnInputChange(true);
});

function OnInputChange(byButton = false) {
	if (!seedInput.value) {
		loadingDiv.innerHTML = '';
		return;
	}

	let seed = seedInput.value;

	let amount = parseInt(amountInput.value);
	if (!amount && amount !== 0) amount = 100;

	HandleUpdateButtonVisibility(amount);

	if (amount >= 5000 && !byButton) return;

	let goodValue = parseFloat(goodValueInput.value);
	if (!goodValue && goodValue !== 0) goodValue = 2;

	if (amount < 800) {
		GetChain(seed, amount, goodValue);
	} else {
		clearTimeout(timeout);
		loadingDiv.innerHTML = 'Loading...';
		timeout = setTimeout(() => {
			GetChain(seed, amount, goodValue);
			loadingDiv.innerHTML = '';
		}, 500);
	}

	UpdateSelectionWindow();
}

function GetChain(seed, amount = 1000, goodValue = 2) {
	resultsDiv.innerHTML = '';

	let chain = [seed];
	amount -= 1;

	if (amount < 0) chain = [];

	for (let i = 0; i < amount; i++) {
		chain.push(
			CryptoJS.algo.SHA256.create()
				.update(chain[chain.length - 1])
				.finalize()
				.toString(CryptoJS.enc.Hex)
		);
	}

	const seedToPoint = (seed, i) => {
		const hmac = CryptoJS.algo.HMAC.create(CryptoJS.algo.SHA256, seed);
		hmac.update(usBlockHashCheckbox.checked ? usBlockHash : blockHash);

		const hex = hmac.finalize().toString(CryptoJS.enc.Hex).substring(0, 8);
		const dec = parseInt(hex, 16);
		const f = parseFloat((4294967296 / (dec + 1)) * (1 - 0.01));

		const point = parseFloat((Math.floor(f * 100) / 100).toFixed(2));

		return point;
	};

	chain = chain.map(seedToPoint);

	let goodCount = 0;
	let totalCount = chain.length;

	for (let value of chain) {
		let multiplier = value;

		const isGood = multiplier >= goodValue;
		if (isGood) goodCount++;

		const div = document.createElement('div');
		div.textContent = multiplier.toFixed(2) + 'X';
		div.className = `crash ${isGood ? 'bom' : 'ruim'}`;
		resultsDiv.appendChild(div);
	}

	UpdateStatistics(totalCount, goodCount);
}

function UpdateStatistics(totalCount = 0, goodCount = 0) {
	if (!totalCount) {
		statisticsDiv.classList.add('hide');
		return;
	}

	statisticsDiv.classList.remove('hide');
	const lossCount = totalCount - goodCount;
	const goodPercentage = ((goodCount / totalCount) * 100).toFixed(2);
	const lossPercentage = ((lossCount / totalCount) * 100).toFixed(2);

	statisticsDiv.innerHTML = `<span class="good">${goodCount}</span>/${totalCount} Wins (<span class="good">${goodPercentage}%</span> Chance) • <span class="bad">${lossCount}</span>/${totalCount} Losses (<span class="bad">${lossPercentage}%</span> Chance)`;
}

function UpdateSelectionWindow() {
	let selectedElements = document.querySelectorAll('.ui-selected');
	// console.log(selectedElements);
	if (selectedElements.length == 0) {
		crashesCount.classList.add('hide');
		return;
	} else {
		crashesCount.classList.remove('hide');
	}

	let goodElements = document.querySelectorAll('.ui-selected.bom');
	let count = selectedElements.length;
	let goodCount = goodElements.length;

	crashesCount.innerHTML = `
        <div>${count} selected</div>
        <div><span class="good">${goodCount}</span>/${count}</div>
    `;
}

function HandleUpdateButtonVisibility(amount) {
	if (amount >= 5000) {
		updateButton.classList.remove('hide');
	} else {
		updateButton.classList.add('hide');
	}
}
