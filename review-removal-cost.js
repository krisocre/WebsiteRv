// ReviewsBoost's published Google fees only. This tool sends no data anywhere.
(function () {
  'use strict';
  var tool=document.getElementById('fee-calculator');
  if(!tool)return;
  var count=tool.querySelector('#cost-review-count');
  var successes=tool.querySelector('#cost-removed-count');
  var money=new Intl.NumberFormat('en-CA',{style:'currency',currency:'CAD',maximumFractionDigits:0});
  function clamp(value,min,max){return Math.min(max,Math.max(min,Math.trunc(Number(value)||min)));}
  function render(event){
    if(event&&event.type==='input'&&event.target.value==='')return;
    var n=clamp(count.value,1,50),r=clamp(successes.value,0,n);
    if(!event||event.type==='change'||event.target===count)count.value=String(n);
    successes.max=String(n);
    successes.value=String(r);
    tool.querySelector('[data-cost="upfront"]').textContent=money.format(n*30);
    tool.querySelector('[data-cost="success"]').textContent=money.format(r*40);
    tool.querySelector('[data-cost="total"]').textContent=money.format(n*30+r*40);
    tool.querySelector('[data-cost="summary"]').textContent=n+' '+(n===1?'review':'reviews')+' ordered, '+r+' removed: '+money.format(n*30)+' upfront + '+money.format(r*40)+' success fees = '+money.format(n*30+r*40)+' CAD before applicable taxes.';
  }
  [count,successes].forEach(function(input){input.addEventListener('input',render);input.addEventListener('change',render);});
  render();
})();
