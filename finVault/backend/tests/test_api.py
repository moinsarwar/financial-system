from conftest import token
def test_application_workflow(client):
 h={'Authorization':'Bearer '+token(client,'admin')}
 payload={'product_type':'car-loan','applicant_cnic':'35202-2222222-2','amount':'1000000','details':'Test'}
 r=client.post('/api/applications',json=payload,headers=h); assert r.status_code==201; a=r.json(); assert a['status']=='draft'; assert len(a['documents'])==4
 hu={'Authorization':'Bearer '+token(client,'user')}; num=a['application_number']
 r=client.post(f'/api/applications/{num}/submit',headers=hu); assert r.status_code==200; assert r.json()['status']=='submitted'
 r=client.post(f'/api/applications/{num}/status',json={'status':'review','expected_version':r.json()['version']},headers=h); assert r.status_code==200

def test_structured_information_request(client):
 h={'Authorization':'Bearer '+token(client,'admin')}; hu={'Authorization':'Bearer '+token(client,'user')}
 a=client.post('/api/applications',json={'product_type':'personal-loan','applicant_cnic':'35202-2222222-2','amount':'1000'},headers=h).json(); n=a['application_number']
 a=client.post(f'/api/applications/{n}/status',json={'status':'submitted','expected_version':a['version']},headers=h).json()
 req={'items':[{'kind':'text','label':'Clarify residential address'}]}
 a=client.post(f'/api/applications/{n}/information-requests',json=req,headers=h).json(); rid=a['info_requests'][0]['public_id']; assert a['status']=='additional-info'
 a=client.post(f'/api/applications/{n}/information-requests/{rid}/response',json={'response_text':'Model Town, Lahore'},headers=hu).json()
 a=client.post(f'/api/applications/{n}/information-requests/submit',headers=hu).json(); assert a['info_requests'][0]['status']=='submitted'
 a=client.post(f'/api/applications/{n}/information-requests/resolve',headers=h).json(); assert a['status']=='submitted'; assert a['info_requests'][0]['status']=='resolved'

def test_product_payload_validation(client):
    h={'Authorization':'Bearer '+token(client,'admin')}
    bad=client.post('/api/applications',json={'product_type':'car-loan','applicant_cnic':'35202-2222222-2'},headers=h)
    assert bad.status_code==422
    bad=client.post('/api/applications',json={'product_type':'bank-account','applicant_cnic':'35202-2222222-2','amount':'-1','account_data':{'account_type':'savings','account_holder':'individual','account_mode':'islamic'}},headers=h)
    assert bad.status_code==422


def test_document_information_request_and_message_thread(client):
    h={'Authorization':'Bearer '+token(client,'admin')}; hu={'Authorization':'Bearer '+token(client,'user')}
    a=client.post('/api/applications',json={'product_type':'personal-loan','applicant_cnic':'35202-2222222-2','amount':'100000'},headers=h).json(); n=a['application_number']
    a=client.post(f'/api/applications/{n}/status',json={'status':'submitted','expected_version':a['version']},headers=h).json()
    request={'items':[{'kind':'document','label':'Updated income proof','document_requirement_code':'income'}]}
    a=client.post(f'/api/applications/{n}/information-requests',json=request,headers=h).json()
    assert a['status']=='additional-info'
    assert next(d for d in a['documents'] if d['requirement_code']=='income')['status']=='required'
    duplicate=client.post(f'/api/applications/{n}/information-requests',json=request,headers=h)
    assert duplicate.status_code==400  # cannot request while already in exception
    files={'file':('income.pdf',b'%PDF-1.4\n% test file','application/pdf')}
    a=client.post(f'/api/applications/{n}/documents/income',files=files,headers=hu).json()
    assert next(d for d in a['documents'] if d['requirement_code']=='income')['status']=='uploaded'
    a=client.post(f'/api/applications/{n}/information-requests/submit',headers=hu).json()
    assert a['info_requests'][0]['status']=='submitted'
    a=client.post(f'/api/applications/{n}/information-requests/resolve',headers=h).json()
    assert a['status']=='submitted'
    sent=client.post(f'/api/applications/{n}/messages',json={'message':'Thread test'},headers=hu)
    assert sent.status_code==200
    thread=client.get(f'/api/applications/{n}/messages',headers=h)
    assert thread.status_code==200
    assert any(m['message']=='Thread test' for m in thread.json())
    marked=client.post(f'/api/applications/{n}/messages/read',headers=h)
    assert marked.status_code==200
