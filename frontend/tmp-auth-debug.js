const axios=require('axios');
(async()=>{
 const base='http://localhost:5000';
 const email=`probe_${Date.now()}_${Math.floor(Math.random()*1e6)}@test.local`;
 console.log('EMAIL',email);
 try{
  const r=await axios.post(`${base}/api/auth/register`,{name:'Probe',email,password:'Pass1234!'});
  console.log('REGISTER',r.status,r.data);
 }catch(e){
  console.log('REGISTER_ERR',e.response?.status,e.response?.data||e.message);
 }
 try{
  const l=await axios.post(`${base}/api/auth/login`,{email,password:'Pass1234!'});
  console.log('LOGIN',l.status,l.data?.user?.email||'no-user');
 }catch(e){
  console.log('LOGIN_ERR',e.response?.status,e.response?.data||e.message);
 }
})();
