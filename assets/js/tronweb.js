let currentAccount;
let lastTransactionTime;
var invested;
let lastTrans = null;
let amountuser;

let siteLoading = true;
let connected = false;
const defaultSponsor = 'TXnvYNyKrHcWzdo6daBWmEJ49WzXJMNJjw';
let contractAddress = 'TXJAwCTozfU9dyoBogAeM5Z3kU2z3dbh6h';
let tronScan = 'https://tronscan.org/#/transaction/';

function startInterval(seconds, callback) {
  callback();
  return setInterval(callback, seconds * 1000);
}



window.addEventListener('message', (e) => {
  if (e.data?.message?.action == 'tabReply') {
    console.warn('tabReply event', e.data.message);
    if (e.data?.message?.data?.data?.node?.chain == '_') {
      console.info('tronLink currently selects the main chain');
    } else {
      console.info('tronLink currently selects the side chain');
    }
  } else if (e.data?.message?.action == 'setAccount') {
    //showPopup('Account Changed', 'success');
    console.warn('setAccount event', e.data.message);
    console.info('current address:', e.data.message.data.address);
  } else if (e.data?.message?.action == 'setNode') {
    console.warn('setNode event', e.data.message);
    if (e.data?.message?.data?.data?.node?.chain == '_') {
      console.info('tronLink currently selects the main chain');
    } else {
      console.info('tronLink currently selects the side chain');
    }
  }
});

/**
 *
 */
$(document).ready(async () => {
  const url = new URL(window.location);
  const params = new URLSearchParams(url.search);
  if (window.location.hostname == '127.0.0.1' || params.has('testing')) {
    contractAddress = 'TXJAwCTozfU9dyoBogAeM5Z3kU2z3dbh6h';
  }
  const contractData = async () => {
    if (window.tronWeb && window.tronWeb.defaultAddress.base58) {
      // clearInterval(checkConnectivity);
      if (!connected) {
        showPopup('Connected to Tron LINK.', 'success');
        connected = true;
      }

      const tronWeb = window.tronWeb;
      currentAccount = tronWeb.defaultAddress.base58;
      $('#address').text(currentAccount);

      const contract = await tronWeb.contract().at(contractAddress);

      getContractDetails(contract);
      getuserstats(contract);
      
	  let profit, totalProfit;
	  	 	
      if (parseInt(invested) > 0) 
	  {
        
		profit = await getProfit(contract);
		profit = parseFloat(tronWeb.fromSun(profit.payout));
		//console.log(profit);
        totalProfit = (profit).toFixed(6);
        
        //$('#refererAddress').val('You Already have a Sponsor');
        $('#refererAddress').prop('disabled', true);

        $('#accountRef').val(
          'https://tronlive.net/?ref=' + currentAccount
        );
      } else {
        if (params.has('ref')) {
          $('#refererAddress').prop('disabled', true);
          $('#refererAddress').val(params.get('ref'));
        } else if ($('#refererAddress').val() == 'You Already have a Sponsor') {
          $('#refererAddress').prop('disabled', false);
          $('#refererAddress').val('');
        }
        $('#accountRef').val(
          'You need to invest at least 100 TRX to activate the referral link.'
        );
        invested = totalProfit = 0;
      }

      if (siteLoading) {
        siteLoading = false;
        runCounter('#actualCapital', invested);        
        runCounter('#totalWithdrawable', totalProfit);
      } else {
        $('#actualCapital').val(invested);
        $('#totalWithdrawable').val(totalProfit);
      }
      $('.deduction').text(totalProfit);
      $('#invested').text(totalProfit);
      $('#withdrawed').text(totalProfit);
      $('#withdrawal').text((totalProfit / 2).toFixed(6));

      $('#reinvest-new-balance').text(
        parseFloat(
          parseFloat($('#actualCapital').val()) + parseFloat(totalProfit)
        ).toFixed(6)
      );
      $('#withdrawal-new-balance').text(
        parseFloat(
          parseFloat($('#actualCapital').val()) - parseFloat(totalProfit / 2)
        ).toFixed(6)
      );
      getBalanceOfAccount();
    } else {
      if (connected) {
        showPopup('Tron LINK is disconnected.', 'error');
        connected = false;
      }
    }
  };
  startInterval(4, contractData);
});
//----------------//
async function getBalanceOfAccount() {
  return tronWeb.trx.getBalance(currentAccount).then((res) => {
    const balance = parseInt(res / 1e6);
    if (balance) {
      $('#balance').text(balance);
    } else {
      $('#balance').text(0);
    }
    return balance;
  });
}      

async function deposit() {
  let address = $('#refererAddress').val();
  let amount = $('#depositAmount').val();
  const contract = await tronWeb.contract().at(contractAddress);
  if (!tronWeb.isAddress(address) && parseInt(invested) < 1) {
    showPopup('Please Enter Right Address', 'error');
  } else if (amount < 100) {
    showPopup('Minimum Amount is 100 TRX', 'error');
  } else if (amount > (await getBalanceOfAccount())) {
    showPopup('Insufficient Balance', 'error');
  } else if ((await getBalanceOfAccount()) - amount < 15) {
    showPopup('You need a few (15) TRX in your wallet to make an transaction', 'error');
  } else {
    if (parseInt(invested) > 0) {
     // address = defaultSponsor;
    }
    if (window.tronWeb) {
      let contract = await tronWeb.contract().at(contractAddress);
      contract
        .deposit(address)
        .send({
          feeLimit:100000000,
          callValue: tronWeb.toSun(amount),
        })
        .then((output) => {
          console.info('Hash ID:', output, '\n');
          //newTransaction(amount);
          //getLastFiveDeposits();
          //getTodayTopDeposits();
          showPopup('Deposit Successful', 'success');
        });
    } else {
      showPopup('TronWeb is not Connected', 'error');
    }
  }
}
//withDraw your fund!
async function withdraw() {
  if (window.tronWeb) {
	    const contract = await tronWeb.contract().at(contractAddress);
	    profit = await getProfit(contract);
		profit = parseFloat(tronWeb.fromSun(profit.payout));
		if(profit >= 10)
		{	  
			let contract = await tronWeb.contract().at(contractAddress);
			await contract
			  .withdraw()
			  .send({feeLimit:100000000,})
			  .then((output) => {
				getBalanceOfAccount();
				console.info('HashId:' + ' ' + output);
				showPopup('Withdraw Successful', 'success');
			  });
		 }
		 else {
			showPopup('You Can Withdraw Minimum 10 TRX!', 'error');
		  }
		 
  } else {
    showPopup('TronWeb is not Connected', 'error');
  }
}
//reinvest your fund!
async function reinvest() {
  if (window.tronWeb) {
	  const contract = await tronWeb.contract().at(contractAddress);
	  profit = await getProfit(contract);
		profit = parseFloat(tronWeb.fromSun(profit.payout));
		if(profit >= 10)
		{	
    let contract = await tronWeb.contract().at(contractAddress);
    await contract
      .reinvest()
      .send({feeLimit:100000000,})
      .then((output) => {
        console.info('HashId:' + ' ' + output);
        showPopup('Reinvest Successful', 'success');
      });
	}
	else {
    showPopup('You Can Re-Invest Minimum 10 TRX!', 'error');
  }
  } else {
    showPopup('TronWeb is not Connected', 'error');
  }
}

async function getContractDetails(contract) {
  let res = await contract.contractInfo().call();
  $('.var_totalInvested').html(thousandsSeparators(parseInt(res._total_deposited.toNumber() / 1e6)));
  $('.var_totalInvestors').html(thousandsSeparators(res._total_users.toNumber()));
  $('.var_activeInsurance').html(thousandsSeparators(parseInt(res._insure_fund.toNumber() / 1e6)));
  $('.var_totalwithdraw').html(thousandsSeparators(parseInt(res._total_withdraw.toNumber() / 1e6)));
  $('.var_poolbalance').html(thousandsSeparators(parseInt(res._pool_balance.toNumber() / 1e6)));
  $('.var_topspramt').html(thousandsSeparators(parseInt(res._toprefamount.toNumber() / 1e6)));
  $('.var_cbalance').html(thousandsSeparators(parseInt(res._balance.toNumber() / 1e6)));;
  var poolbalance = parseInt(res._pool_balance.toNumber() / 1e6);
  var poolbonus = [40,30,20,10];
  res = await contract.poolTopInfo().call();
  var reward = 0;
  var trxdepo = 0;
  for(let i = 0; i < res.addrs.length; i++) 
  {
	  	reward = (poolbalance * poolbonus[i] / 100);
		trxdepo = (res.deps[i] / 1e6);
		if(res.addrs[i].substr(2) == '0000000000000000000000000000000000000000') break;		
		$(".var_topspr" + (i+1)).html('<td style="width:60%;">' + tronWeb.address.fromHex(res.addrs[i]) + '</td><td style="width:20%;">' + trxdepo + ' TRX </td><td style="width:20%;">' + reward + ' TRX</td>');
	}
}

async function getuserstats(contract){

let invester = await contract.users(currentAccount).call();
	invested = invester.active_deposit.toNumber() / 1e6;	
  $('#address2').text(currentAccount);
  //const userpayout = invester.payoutSum.toNumber() / 1e6;
  //$('#userpayout').text(userpayout.toFixed(2));
  const sponsoraddress1 = invester.upline;
  const sponsoraddress= tronWeb.address.fromHex(sponsoraddress1);
 // hex_address = tronWeb.address.toHex(address);
  if (sponsoraddress == 'T9yD14Nj9j7xAB4dbGeiX9h8unkKHxuWwb')
  {
 	//$('#refererAddress').val("You have no Sponsor");
  }
  else
  {
    $('#refererAddress').val(sponsoraddress);
  }
  
  const refrewards = invester.direct_bonus.toNumber() / 1e6;
   
    $('#refrewards').text(refrewards.toFixed(2));
    $('.var_myteam').html(invester.total_structure.toNumber());
	$('.var_mydirect').html(invester.referrals.toNumber());
	$('#limitRemain').val((invester.wid_limit.toNumber() - invester.total_payouts.toNumber()) / 1e6);
	$('#incomeReceived').val(invester.total_payouts.toNumber() / 1e6);
	$('#directBonus').val(invester.direct_bonus.toNumber() / 1e6);
	$('#poolBonus').val(invester.pool_bonus.toNumber() / 1e6);
}

/**
 *
 * @param {*} contract
 */
async function getProfit(contract) {
  return await contract.payoutOf(currentAccount).call();
}

copy = () => {
  /* Get the text field */
  var copyText = document.getElementById('accountRef');

  /* Select the text field */
  copyText.select();
  copyText.setSelectionRange(0, 99999); /*For mobile devices*/

  /* Copy the text inside the text field */
  document.execCommand('copy');

  showPopup('Copied', 'success');
};

thousandsSeparators = (num) => {
  var num_parts = num.toString().split('.');
  num_parts[0] = num_parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return num_parts.join('.');
};

showPopup = (msg, type) => {
  $(`#popup-${type}-msg`).html(msg);

  $('.popup').removeClass('show');

  $(`.${type}-popover`).addClass('show');
  window.setTimeout(() => {
    $(`.${type}-popover`).removeClass('show');
  }, 3 * 1000);
};

runCounter = (id, value) => {
  $({ Counter: 0 }).animate(
    {
      Counter: value,
    },
    {
      duration: 1000,
      easing: 'swing',
      step: function (now) {
        $(id).val(now.toFixed(6));
      },
    }
  );
};

newTransaction = (amount) => {
  $(`#custom-popover-msg`).html(amount + ' TRX Deposited');
  $('.custom-popover').addClass('custom-popover-active');
  window.setTimeout(() => {
    $('.custom-popover').removeClass('custom-popover-active');
  }, 3000);
};