import urllib.request
from bs4 import BeautifulSoup
from pymongo import MongoClient
import re
import boto3

def detect_labels(bucket, key, max_labels=10, min_confidence=20, region="us-west-2"):
    rekognition = boto3.client("rekognition", region)
    response = rekognition.detect_labels(
        Image={
            "S3Object": {
                "Bucket": bucket,
                "Name": key,
            }
        },
        MaxLabels=max_labels,
        MinConfidence=min_confidence,
    )
    return response['Labels']

if __name__ == '__main__':
    # Config
    local = 'ASTN'
    page = 1

    #print( [ label['Name'] for label in detect_labels('petsconnect', 'A716132.jpeg')] )

    # Db
    #client = MongoClient('mongodb://localhost')
    #db = client.pets

    # Scrape ids
    #url='http://petharbor.com/results.asp?searchtype=ALL&start=2&friends=1&samaritans=1&nosuccess=0&orderby=ID&rows=200&imght=120&imgres=thumb&tWidth=200&view=sysadm.v_austin&nobreedreq=1&bgcolor=ffffff&text=29abe2&link=024562&alink=017db3&vlink=017db3&fontface=arial&fontsize=10&col_hdr_bg=29abe2&col_hdr_fg=29abe2&col_fg=29abe2&SBG=ffffff&zip=78702&miles=200&shelterlist=%27ASTN%27,%27HSTN%27,%27CRPC%27,%27GRGT%27,%27KLEN%27,%27LFKN%27,%27SUGR%27,%27TMPL%27,%27WACO%27,%27CNRO%27&atype=&where=type_CAT&PAGE='+str(page)
    url='http://petharbor.com/results.asp?searchtype=ALL&start=2&friends=1&samaritans=1&nosuccess=0&orderby=ID&rows=200&imght=120&imgres=thumb&tWidth=200&view=sysadm.v_austin&nobreedreq=1&bgcolor=ffffff&text=29abe2&link=024562&alink=017db3&vlink=017db3&fontface=arial&fontsize=10&col_hdr_bg=29abe2&col_hdr_fg=29abe2&col_fg=29abe2&SBG=ffffff&zip=78702&miles=200&shelterlist=%27ASTN%27&atype=&where=type_CAT&PAGE='+str(page)
    page = urllib.request.urlopen(url)
    soup = BeautifulSoup(page)
    ids = soup.body.findAll(text=re.compile('A[0-9]+'))

    # Get pictures
    for page in range(1, 20):
        for i, id in enumerate(ids):
            print('downloading image', id)
            img_url = 'http://petharbor.com/get_image.asp?RES=Detail&ID='+str(id)+'&LOCATION='+str(local)#+'./cats/'+str(local)+'/'+str(id)+'.jpeg'
            print(img_url)
            #urllib.request.urlretrieve('http://petharbor.com/get_image.asp?RES=Detail&ID='+str(id)+'&LOCATION='+str(local),

            # Download image
            urllib.request.urlretrieve(img_url, './cats/'+str(id)+'.jpeg')
            '''
            db.inventory.insert({
                'url': 'http://petharbor.com/pet.asp?uaid='+local+'.'+str(i),
                'img_url': img_url,
                'descriptors': [ label['Name'] for label in
                    detect_labels('petsconnect', str(i)+'.jpeg') ]
            })
            console.log('saved ' + i + ' to db');
            '''
