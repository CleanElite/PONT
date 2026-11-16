/* PONT – format unitar de afișare: zi-lună-an (ZZ-LL-AAAA).
   Formatăm numai texte vizibile, niciodată valori din input, baze de date sau atribute tehnice. */
(()=>{
'use strict';
const pattern=/\b((?:19|20)\d{2})[-\/](0[1-9]|1[0-2])[-\/]([0-2]\d|3[01])\b/g;
const skip='script,style,textarea,option,code,pre,kbd,samp,svg,[contenteditable],[contenteditable="true"]';
function convert(node){
 if(!node||node.nodeType!==Node.TEXT_NODE||!node.nodeValue)return;
 const parent=node.parentElement;if(!parent||parent.closest(skip))return;
 if(!/\b(?:19|20)\d{2}[-\/]\d{2}[-\/]\d{2}\b/.test(node.nodeValue))return;
 const updated=node.nodeValue.replace(pattern,(_,y,m,d)=>d+'-'+m+'-'+y);
 if(updated!==node.nodeValue)node.nodeValue=updated;
}
function scan(root){
 if(!root)return;
 if(root.nodeType===Node.TEXT_NODE){convert(root);return;}
 if(root.nodeType!==Node.ELEMENT_NODE&&root.nodeType!==Node.DOCUMENT_FRAGMENT_NODE&&root.nodeType!==Node.DOCUMENT_NODE)return;
 if(root.nodeType===Node.ELEMENT_NODE&&root.matches(skip))return;
 const walker=document.createTreeWalker(root,NodeFilter.SHOW_TEXT);
 while(walker.nextNode())convert(walker.currentNode);
}
scan(document.body);
const pending=new Set();let scheduled=false;
function flush(){scheduled=false;for(const node of pending)scan(node);pending.clear();}
const observer=new MutationObserver(records=>{
 for(const entry of records){
  if(entry.type==='characterData')pending.add(entry.target);
  else for(const node of entry.addedNodes)pending.add(node);
 }
 if(!scheduled&&pending.size){scheduled=true;queueMicrotask(flush);}
});
observer.observe(document.body,{childList:true,subtree:true,characterData:true});
})();