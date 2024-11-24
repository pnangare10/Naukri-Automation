const applyJobsAPI = async (bodyStr, authorization = accessToken) =>
  fetch(
    "https://www.naukri.com/cloudgateway-workflow/workflow-services/apply-workflow/v1/apply",
    {
      headers: {
        accept: "application/json",
        "accept-language": "en-IN,en-GB;q=0.9,en-US;q=0.8,en;q=0.7",
        appid: "121",
        authorization: `ACCESSTOKEN = ${authorization}`,
        "cache-control": "no-cache",
        clientid: "d3skt0p",
        "content-type": "application/json",
        pragma: "no-cache",
        priority: "u=1, i",
        "sec-ch-ua":
          '"Chromium";v="124", "Google Chrome";v="124", "Not-A.Brand";v="99"',
        "sec-ch-ua-mobile": "?0",
        "sec-ch-ua-platform": '"Windows"',
        "sec-fetch-dest": "empty",
        "sec-fetch-mode": "cors",
        "sec-fetch-site": "same-origin",
        systemid: "jobseeker",
        cookie:
          "_t_ds=70658061700460751-967065806-07065806; test=naukri.com; NKWAP=db4fc3d77f3654247ba809e089a4c0fd58822d409817dbb65901a3ad0448c2d9ff003c62a2e1a36431b890266d0ecd01~e57335e68a4c79d57991fe1eeace01ba06af162a82756b4726a28621705d5d90~1~0; MYNAUKRI[UNID]=8cdb4e75d73f4f71b0d8bac441c6b12c; _ff_ds=0142892001703227914-934C4012B761-C90278B377EE; _abck=E7411040D477C6E8C97961E17B0AA04F~0~YAAQhf7UF8jj32aMAQAAPiv9tAvgZVjsT+xsc0yua+94T3ilcs3vl19e9KRK9UmDvf9WCdzp7qSmOf5iumFfsi86zM2xozZaOyOLQQOrB8Nxj0eJeUhmQlhvG4Ik52ziEqeEVQ+UAsvghpz8NEqq09W5s/ouCAvuHnZnYXQEgr3SFFvgguin+SKfHD3V6kwXYOt1fsgH1+eX9HCT4SCJ+qpRbt3O/2ru7kvf+Mu+YKc05OpcjFS7+2MCCrcHKxdl2GNHuMwFSWnrTzJbICe3U8z2FZQv6+DQbN6HqQtQU95Y/SuU59RLry+jJhiZNv+M97JTdcSfuv1WyUEyDCV8iV92Z3pVpBe7CygCUDCXOJocChdnyXZBZZKXHac6ICmf35P3Ksoe0dJMcy895btaFuunT3zq3Efn~-1~-1~-1; _t_s=direct; _t_r=1030%2F%2F; persona=default; J=0; _ga=GA1.1.592942086.1714067166; _gcl_au=1.1.373342456.1714067177; PHPSESSID=hgc8mdc0rj5lj8mv594i3gmk3q; nauk_rt=eyJraWQiOiIxIiwidHlwIjoiSldUIiwiYWxnIjoiUlM1MTIifQ.eyJ1ZF9yZXNJZCI6MTgwNDAzNzg4LCJzdWIiOiIxODYwMDM2OTIiLCJ1ZF91c2VybmFtZSI6ImYxNTg0NTA1MDEuODU5NCIsInVkX2lzRW1haWwiOnRydWUsImlzcyI6IkluZm9FZGdlIEluZGlhIFB2dC4gTHRkLiIsInVzZXJBZ2VudCI6Ik1vemlsbGEvNS4wIChXaW5kb3dzIE5UIDEwLjA7IFdpbjY0OyB4NjQpIEFwcGxlV2ViS2l0LzUzNy4zNiAoS0hUTUwsIGxpa2UgR2Vja28pIENocm9tZS8xMjQuMC4wLjAgU2FmYXJpLzUzNy4zNiIsImlwQWRyZXNzIjoiMjAyLjEzNi43MS4yMyIsInVkX2lzVGVjaE9wc0xvZ2luIjpmYWxzZSwidXNlcklkIjoxODYwMDM2OTIsInN1YlVzZXJUeXBlIjoiam9ic2Vla2VyIiwidXNlclN0YXRlIjoiQVVUSEVOVElDQVRFRCIsInVkX2lzUGFpZENsaWVudCI6ZmFsc2UsInVkX2VtYWlsVmVyaWZpZWQiOnRydWUsInVzZXJUeXBlIjoiam9ic2Vla2VyIiwic2Vzc2lvblN0YXRUaW1lIjoiMjAyNC0wNC0yNVQyMzoxNjozOCIsInVkX2VtYWlsIjoicHJhbmVzaG5hbmdhcmUxMEBnbWFpbC5jb20iLCJ1c2VyUm9sZSI6InVzZXIiLCJleHAiOjE3NDU2MDMxOTgsInRva2VuVHlwZSI6InJlZnJlc2hUb2tlbiIsImlhdCI6MTcxNDA2NzE5OCwianRpIjoiYjRmYzg3MDE4MjhlNGJjOTk4Y2QzY2I2ZmJjODdmNTIifQ.X39x8QC_5uVoD5gCuRxkm5FPBdY_o3eWCJQ1MRAD3Y41pwAA9shUuUd-NZ4z7fThCUeplDJXN4Sgf7eIpHISYTmm48yhSzfBxemYuiXvzQSOY1Gj9Od308mP5cJKjX83DJFEjHqUuHyyQGzl9o7JyBmzdAaRH5sa7rVkiggnjg18N3X3xbl-cJSDlRIS3VDgUy1IrofrHjA-WBFOwqVpK3TLUmTLjHehKmcuai5NkPKtYB7_Z9XTHAnlEiff_orQdVHqAG1Yton5stNq30OK-7UL5MFbh71h8mu5x8RNync-HNvODb-543eosSZZ3gO_u5MlCFIiRF4OrvF-eVyigA; nauk_sid=b4fc8701828e4bc998cd3cb6fbc87f52; nauk_otl=b4fc8701828e4bc998cd3cb6fbc87f52; _ga_T749QGK6MQ=GS1.1.1714067171.1.1.1714067199.0.0.0; nauk_ps=default; PS=e57335e68a4c79d57991fe1eeace01ba06af162a82756b4726a28621705d5d90; __gads=ID=4f454b8d75c80fdb:T=1714067252:RT=1714067252:S=ALNI_MYGCavsrzaOV11nzP0lOXY0_fSuoA; __gpi=UID=00000dfb0de65670:T=1714067252:RT=1714067252:S=ALNI_Mbt_-Bofq1uO9uu7xQR21VS5J9SzQ; __eoi=ID=d275092e06f17c78:T=1714067252:RT=1714067252:S=AA-AfjZVqAJpsAwpnTkgYwgoXBwX; bm_mi=9CE70EC598669ECF6793C7E073C50A16~YAAQj/7UF/p109COAQAAO5QCFxeRMUwXgRS7T0RYa0rKtFrs3uERi1kQub8o5HrBfQwogt+1yRtdVjRsFtxiiVOJ6iCF2/DWVtdhhnbW5DUSu1T5o0e4PU0XtAZRbxK0JXk9bcWD7HEQ4LRnULxznLSI0j+QZ0ZEGqmgTCDq+WOrv0TW9UhvNoyZA2SlrM3zAhWxZGKxDwotD/SDyvw8GIdoaNM+exbk9ci0GdWz5AZ0rvCwieQ/VcM6ojUuaAoPrGaa5mjw/ZeRpYFFerHzI/k2nCsYrSCXQIg4UsfqvBJtPt34sWEfCYLQXXXCJIU0axE9XRLEhps3Zlqh2A==~1; ak_bmsc=FDA633D7E825319EEA6EF5C9EC210501~000000000000000000000000000000~YAAQj/7UF1V209COAQAApaMCFxcduOfw50HdXYUzcU2NekZdFYJ9VG+V9wwPfpucXOe+xLNwjya9Ehb4K/M4dRwWq3LW+068nXGb5G0Kw5iiHXIRqoXI/dMo4TbNtM+UDC5B82sYxDRfpCN9u8DR1CUuk3NBq3/U9R7mVJP485H1rpXamLx1qxaISaHaY1mEqvpLgUWryUVfSfCUTvgPSa/3KnRn8K33znVHyZiPMjUAGRfGe+fafwNWOx6FOgAabrfPYT/9WrxvOX3HO3IXFIneazHeOvUj6gS4amF/IwVls8q8IES2X/3GvkDlF6XyQVTmDe01dPYkVmCxczMq3VzDQolMW78pS5Y65xVPVD3iGI+uWAO4W3O4ctlsLxP1PqvsLo8A8ic48T8+th5DdBglNSC9u2sM0uzsX4hIu63esYoBC40jLAMK0plWODjuRcz3TpxtwbXISIVVE4u2tjX1VSDeijfTfP3cuTnkxYJ1oee/n7UaMIll/odkXA==; ACTIVE=1714078048; nauk_at=eyJraWQiOiIxIiwidHlwIjoiSldUIiwiYWxnIjoiUlM1MTIifQ.eyJ1ZF9yZXNJZCI6MTgwNDAzNzg4LCJzdWIiOiIxODYwMDM2OTIiLCJ1ZF91c2VybmFtZSI6ImYxNTg0NTA1MDEuODU5NCIsInVkX2lzRW1haWwiOnRydWUsImlzcyI6IkluZm9FZGdlIEluZGlhIFB2dC4gTHRkLiIsInVzZXJBZ2VudCI6Ik1vemlsbGEvNS4wIChXaW5kb3dzIE5UIDEwLjA7IFdpbjY0OyB4NjQpIEFwcGxlV2ViS2l0LzUzNy4zNiAoS0hUTUwsIGxpa2UgR2Vja28pIENocm9tZS8xMjQuMC4wLjAgU2FmYXJpLzUzNy4zNiIsImlwQWRyZXNzIjoiMjAyLjEzNi43MS4yMyIsInVkX2lzVGVjaE9wc0xvZ2luIjpmYWxzZSwidXNlcklkIjoxODYwMDM2OTIsInN1YlVzZXJUeXBlIjoiam9ic2Vla2VyIiwidXNlclN0YXRlIjoiQVVUSEVOVElDQVRFRCIsInVkX2VtYWlsVmVyaWZpZWQiOnRydWUsInVkX2lzUGFpZENsaWVudCI6ZmFsc2UsInVzZXJUeXBlIjoiam9ic2Vla2VyIiwic2Vzc2lvblN0YXRUaW1lIjoiMjAyNC0wNC0yNVQyMzoxNjozOCIsInVkX2VtYWlsIjoicHJhbmVzaG5hbmdhcmUxMEBnbWFpbC5jb20iLCJ1c2VyUm9sZSI6InVzZXIiLCJleHAiOjE3MTQwODM3MDYsInRva2VuVHlwZSI6ImFjY2Vzc1Rva2VuIiwiaWF0IjoxNzE0MDgwMTA2LCJqdGkiOiJiNGZjODcwMTgyOGU0YmM5OThjZDNjYjZmYmM4N2Y1MiJ9.r-h6j5SighfkiZyFRnJRVvSwH45QgaeOORRILMaPzidDgU5tJV36_7sgoZvc2eHtiyxTOHqmqUbqPULE8sx_2qDJcVJlkj39ehHfxLPjIvPM30RvvxTJIE3IIiSOnO7aTSeVoBsYdaNvcXmLPriMYq3vFhz6c11HeCPZ-aptzKK_p32XLL5RMEVO_sropBnp2XjllLvYsDGt8yoY0hSfJ_36QOFZeJlTAkRNa5JBvccSXipvs23ol23yYHlMD6MKxoYw4ZKQQrqO9NlmuSCggh0avAEZUiZBGIQJ0jgRJ5fjCZ-hxzAluimKiKblTm5Bpkhp5P3hgSML6Krjey28aw; is_login=1; failLoginCount=0; HOWTORT=cl=1714080106217&r=https%3A%2F%2Fwww.naukri.com%2Fjob-listings-react-js-developer-infineit-global-services-llp-surat-4-to-8-years-220424502012%3Fsrc%3DsimJobDeskACP%26sid%3D1714078608445246%26xp%3D1%26px%3D1&nu=https%3A%2F%2Fwww.naukri.com%2Fmnjuser%2Frecommendedjobs&ul=1714080106258&hd=1714080106844; _ga_K2YBNZVRLL=GS1.1.1714077996.2.1.1714080115.51.0.0; bm_sv=5015DEFC3F0F5798A75A335743081558~YAAQDF3SF6p/zc+OAQAAufEiFxcQMjTqrnKFDDTFjJH5yxad12i0GVwxwOwNUwtvvJDRzxyx1evvhcqaBaUSL+GVo7DpiYTDzFkKu/94OYBIFXh2Ol1tUyDe34XB8nwMLzfUny/+8HdE3ctlvI/+HLFtowebLK83Cyd6CJSayvoa1oe7PjB4DPXBjsQ+7+VvxdZTG6yvnEfXWTWp/V4W4jVF1J86Yq0wcPReYZfSWJyYiXWIl+8V3gMett/ts4fnKF4=~1",
        Referer:
          "https://www.naukri.com/job-listings-react-js-front-end-development-briskwin-it-bwit-pune-chennai-mumbai-all-areas-5-to-10-years-210324005750?src=drecomm_profile&sid=17140801091455348&xp=2&px=1",
        "Referrer-Policy": "strict-origin-when-cross-origin",
      },
      body: `${bodyStr},"logstr":"--drecomm_profile-2-F-0-1--17140801091455348-","flowtype":"show","crossdomain":true,"jquery":1,"rdxMsgId":"","chatBotSDK":true,"mandatory_skills":["CSS","HTML","React.Js"],"optional_skills":["Typescript","Angular"],"applyTypeId":"107","closebtn":"y","applySrc":"drecomm_profile","sid":"17140801091455348","mid":""}`,
      method: "POST",
    }
  );

const searchJobsAPI = (pageNo, keywords, authorization = accessToken) =>
  fetch(
    `https://www.naukri.com/jobapi/v3/search?noOfResults=20&urlType=search_by_key_loc&searchType=adv&location=pune%2C%20mumbai%2C%20bengaluru%2C%20bangalore&keyword=${keywords}&sort=p&pageNo=${pageNo}&experience=3&ctcFilter=6to10&ctcFilter=10to15&ctcFilter=15to25&ctcFilter=25to50&ctcFilter=50to75&ctcFilter=75to100&k=${keywords}&l=pune%2C%20mumbai%2C%20bengaluru%2C%20bangalore&nignbevent_src=jobsearchDeskGNB&experience=3&ctcFilter=6to10&ctcFilter=10to15&ctcFilter=15to25&ctcFilter=25to50&ctcFilter=50to75&ctcFilter=75to100&src=cluster&latLong=18.7506117_73.8764436&sid=17143714288347830_8`,
    {
      headers: {
        accept: "application/json",
        "accept-language": "en-IN,en-GB;q=0.9,en-US;q=0.8,en;q=0.7",
        appid: "109",
        authorization: `Bearer ${authorization}`,
        "cache-control": "no-cache",
        clientid: "d3skt0p",
        "content-type": "application/json",
        gid: "LOCATION,INDUSTRY,EDUCATION,FAREA_ROLE",
        pragma: "no-cache",
        priority: "u=1, i",
        "sec-ch-ua":
          '"Chromium";v="124", "Google Chrome";v="124", "Not-A.Brand";v="99"',
        "sec-ch-ua-mobile": "?0",
        "sec-ch-ua-platform": '"Windows"',
        "sec-fetch-dest": "empty",
        "sec-fetch-mode": "cors",
        "sec-fetch-site": "same-origin",
        systemid: "Naukri",
        cookie:
          "_t_ds=70658061700460751-967065806-07065806; test=naukri.com; NKWAP=db4fc3d77f3654247ba809e089a4c0fd58822d409817dbb65901a3ad0448c2d9ff003c62a2e1a36431b890266d0ecd01~e57335e68a4c79d57991fe1eeace01ba06af162a82756b4726a28621705d5d90~1~0; MYNAUKRI[UNID]=8cdb4e75d73f4f71b0d8bac441c6b12c; _ff_ds=0142892001703227914-934C4012B761-C90278B377EE; _abck=E7411040D477C6E8C97961E17B0AA04F~0~YAAQhf7UF8jj32aMAQAAPiv9tAvgZVjsT+xsc0yua+94T3ilcs3vl19e9KRK9UmDvf9WCdzp7qSmOf5iumFfsi86zM2xozZaOyOLQQOrB8Nxj0eJeUhmQlhvG4Ik52ziEqeEVQ+UAsvghpz8NEqq09W5s/ouCAvuHnZnYXQEgr3SFFvgguin+SKfHD3V6kwXYOt1fsgH1+eX9HCT4SCJ+qpRbt3O/2ru7kvf+Mu+YKc05OpcjFS7+2MCCrcHKxdl2GNHuMwFSWnrTzJbICe3U8z2FZQv6+DQbN6HqQtQU95Y/SuU59RLry+jJhiZNv+M97JTdcSfuv1WyUEyDCV8iV92Z3pVpBe7CygCUDCXOJocChdnyXZBZZKXHac6ICmf35P3Ksoe0dJMcy895btaFuunT3zq3Efn~-1~-1~-1; persona=default; J=0; _gcl_au=1.1.373342456.1714067177; PHPSESSID=hgc8mdc0rj5lj8mv594i3gmk3q; nauk_rt=eyJraWQiOiIxIiwidHlwIjoiSldUIiwiYWxnIjoiUlM1MTIifQ.eyJ1ZF9yZXNJZCI6MTgwNDAzNzg4LCJzdWIiOiIxODYwMDM2OTIiLCJ1ZF91c2VybmFtZSI6ImYxNTg0NTA1MDEuODU5NCIsInVkX2lzRW1haWwiOnRydWUsImlzcyI6IkluZm9FZGdlIEluZGlhIFB2dC4gTHRkLiIsInVzZXJBZ2VudCI6Ik1vemlsbGEvNS4wIChXaW5kb3dzIE5UIDEwLjA7IFdpbjY0OyB4NjQpIEFwcGxlV2ViS2l0LzUzNy4zNiAoS0hUTUwsIGxpa2UgR2Vja28pIENocm9tZS8xMjQuMC4wLjAgU2FmYXJpLzUzNy4zNiIsImlwQWRyZXNzIjoiMjAyLjEzNi43MS4yMyIsInVkX2lzVGVjaE9wc0xvZ2luIjpmYWxzZSwidXNlcklkIjoxODYwMDM2OTIsInN1YlVzZXJUeXBlIjoiam9ic2Vla2VyIiwidXNlclN0YXRlIjoiQVVUSEVOVElDQVRFRCIsInVkX2lzUGFpZENsaWVudCI6ZmFsc2UsInVkX2VtYWlsVmVyaWZpZWQiOnRydWUsInVzZXJUeXBlIjoiam9ic2Vla2VyIiwic2Vzc2lvblN0YXRUaW1lIjoiMjAyNC0wNC0yNVQyMzoxNjozOCIsInVkX2VtYWlsIjoicHJhbmVzaG5hbmdhcmUxMEBnbWFpbC5jb20iLCJ1c2VyUm9sZSI6InVzZXIiLCJleHAiOjE3NDU2MDMxOTgsInRva2VuVHlwZSI6InJlZnJlc2hUb2tlbiIsImlhdCI6MTcxNDA2NzE5OCwianRpIjoiYjRmYzg3MDE4MjhlNGJjOTk4Y2QzY2I2ZmJjODdmNTIifQ.X39x8QC_5uVoD5gCuRxkm5FPBdY_o3eWCJQ1MRAD3Y41pwAA9shUuUd-NZ4z7fThCUeplDJXN4Sgf7eIpHISYTmm48yhSzfBxemYuiXvzQSOY1Gj9Od308mP5cJKjX83DJFEjHqUuHyyQGzl9o7JyBmzdAaRH5sa7rVkiggnjg18N3X3xbl-cJSDlRIS3VDgUy1IrofrHjA-WBFOwqVpK3TLUmTLjHehKmcuai5NkPKtYB7_Z9XTHAnlEiff_orQdVHqAG1Yton5stNq30OK-7UL5MFbh71h8mu5x8RNync-HNvODb-543eosSZZ3gO_u5MlCFIiRF4OrvF-eVyigA; nauk_sid=b4fc8701828e4bc998cd3cb6fbc87f52; nauk_otl=b4fc8701828e4bc998cd3cb6fbc87f52; _ga_T749QGK6MQ=GS1.1.1714067171.1.1.1714067199.0.0.0; nauk_ps=default; PS=e57335e68a4c79d57991fe1eeace01ba06af162a82756b4726a28621705d5d90; ACTIVE=1714187542; _t_ds=70658061700460751-967065806-07065806; _ga=GA1.1.592942086.1714067166; _t_s=direct; _t_r=1091%2F%2F; nauk_at=eyJraWQiOiIxIiwidHlwIjoiSldUIiwiYWxnIjoiUlM1MTIifQ.eyJ1ZF9yZXNJZCI6MTgwNDAzNzg4LCJzdWIiOiIxODYwMDM2OTIiLCJ1ZF91c2VybmFtZSI6ImYxNTg0NTA1MDEuODU5NCIsInVkX2lzRW1haWwiOnRydWUsImlzcyI6IkluZm9FZGdlIEluZGlhIFB2dC4gTHRkLiIsInVzZXJBZ2VudCI6Ik1vemlsbGEvNS4wIChXaW5kb3dzIE5UIDEwLjA7IFdpbjY0OyB4NjQpIEFwcGxlV2ViS2l0LzUzNy4zNiAoS0hUTUwsIGxpa2UgR2Vja28pIENocm9tZS8xMjQuMC4wLjAgU2FmYXJpLzUzNy4zNiIsImlwQWRyZXNzIjoiMjAyLjEzNi43MS4yMyIsInVkX2lzVGVjaE9wc0xvZ2luIjpmYWxzZSwidXNlcklkIjoxODYwMDM2OTIsInN1YlVzZXJUeXBlIjoiam9ic2Vla2VyIiwidXNlclN0YXRlIjoiQVVUSEVOVElDQVRFRCIsInVkX2VtYWlsVmVyaWZpZWQiOnRydWUsInVkX2lzUGFpZENsaWVudCI6ZmFsc2UsInVzZXJUeXBlIjoiam9ic2Vla2VyIiwic2Vzc2lvblN0YXRUaW1lIjoiMjAyNC0wNC0yNVQyMzoxNjozOCIsInVkX2VtYWlsIjoicHJhbmVzaG5hbmdhcmUxMEBnbWFpbC5jb20iLCJ1c2VyUm9sZSI6InVzZXIiLCJleHAiOjE3MTQzMTg0MzcsInRva2VuVHlwZSI6ImFjY2Vzc1Rva2VuIiwiaWF0IjoxNzE0MzE0ODM3LCJqdGkiOiJiNGZjODcwMTgyOGU0YmM5OThjZDNjYjZmYmM4N2Y1MiJ9.L294G7euMMOwsHkpV4l2IhIPzu_blrYMrq3KchoMSe_3ou5UYUdxcZGCAIEmgckSEo8wCR9jhSOeOLcki5BdTf5rusGzyZlMqlmFdbYfJF5sr5RkAkr0uofYicywfx2QzVU1l-1xz90g7cSm41tW-F3L4oLH5oumaZgl8Ql4nQihJA1m2mGHwkIjyTt1e_ztma3R07iml1ny-lH9Y1FOTNSpnAYpKlMXf9Z6kJpfoxo1xskU-E-fJMyDQb-S35YNbOBqhWI6jOY9DRW2ccYTNqy8QrLj-FsLdrOAysMMTUsC20P68y4mjf8bapOGMOMmTnHSFml2RtWdBpXHDr1P0Q; is_login=1; ak_bmsc=CE50BBBA9666008D4801EFDE879EA66F~000000000000000000000000000000~YAAQj/7UF4Fw4tGOAQAAm4IgJRcTm89uboeYkf1i/mn+7AXnzOtoGybg5jyWOPgH8D3pS8Ql6s8h2Wv+xhJ96DDSjmQ4m1mZ9hOMcWBFruM77vcJZZAqAPokMQ9iTqX4wvEsLqxESKDqyQESPOZb4E59y3vyhQAIwRELj7ctBmogqztzHP0J8wzdZgato33qRmgNUhcPTfvhANXPNKwimeoQckv0WxJxmngIhnRE1IWrTz0GCd6TnhRAAKVCp1fqEBI07dOIXPlv8QffrHoruJnbJAc4pOPOq5P5rXwxr+tcBK33SA9sLMECpjlMMa30E6lH57Um3mKymsuthT6ZQejTHnCxg1dWtLm7pOZM6kZOmOiwEfV7/EUlkLxppXsn5+jbUzcVzRRJvyZadoKYBmE6/c/ZWPHsaljonhczLMXuxf76VH7+zLyrLTc2FWt/4Jrg0Yy88FOnkUFg; __gads=ID=4f454b8d75c80fdb:T=1714067252:RT=1714314862:S=ALNI_MYGCavsrzaOV11nzP0lOXY0_fSuoA; __gpi=UID=00000dfb0de65670:T=1714067252:RT=1714314862:S=ALNI_Mbt_-Bofq1uO9uu7xQR21VS5J9SzQ; __eoi=ID=d275092e06f17c78:T=1714067252:RT=1714314862:S=AA-AfjZVqAJpsAwpnTkgYwgoXBwX; bm_sv=29E84D62A30FC0FE7FF8D55BA01018FC~YAAQnv7UFx6fIgGPAQAA5WojJRc639ZL9qmgZENTpN/vJCnM9prjKiJGnhdWjHArJsB982dgphkgiBjgdSydCDv3UbYbhre825Enmfvoyz5a7PcMepvqwQKhGxUKPRbO4JU30tM5fTzuAS/TuU/BUekA6jkKAy+ufnhFgqVA4a9LoyC3UvyCt57OE+3J54+9YqO/1SQ2sQ4adK8cEYMkJAw4+zVn698mUn9QL5baCqMHdoHKUKR29xDqODSvMWLH9w==~1; HOWTORT=cl=1714314973806&r=https%3A%2F%2Fwww.naukri.com%2Freact-js-jobs%3Fk%3Dreact%2520js%26nignbevent_src%3DjobsearchDeskGNB%26ctcFilter%3D10to15%26ctcFilter%3D15to25%26ctcFilter%3D25to50%26experience%3D2%26jobAge%3D15&ul=1714315029308&hd=1714315029536; _ga_K2YBNZVRLL=GS1.1.1714314841.9.1.1714315029.6.0.0",
        Referer:
          "https://www.naukri.com/react-js-jobs?k=react%20js&nignbevent_src=jobsearchDeskGNB&ctcFilter=10to15&ctcFilter=15to25&ctcFilter=25to50&experience=2&jobAge=15",
        "Referrer-Policy": "strict-origin-when-cross-origin",
      },
      body: null,
      method: "GET",
    }
  );

const getJobDetailsAPI = (jobId, authorization = accessToken) =>
  fetch(
    `https://www.naukri.com/jobapi/v4/job/${jobId}?microsite=y&src=jobsearchDesk&sid=1714278791789807&xp=1&px=1`,
    {
      headers: {
        accept: "application/json",
        "accept-language": "en-IN,en-GB;q=0.9,en-US;q=0.8,en;q=0.7",
        appid: "121",
        authorization: `Bearer ${authorization}`,
        "cache-control": "no-cache",
        clientid: "d3skt0p",
        "content-type": "application/json",
        gid: "LOCATION,INDUSTRY,EDUCATION,FAREA_ROLE",
        pragma: "no-cache",
        priority: "u=1, i",
        "sec-ch-ua":
          '"Chromium";v="124", "Google Chrome";v="124", "Not-A.Brand";v="99"',
        "sec-ch-ua-mobile": "?0",
        "sec-ch-ua-platform": '"Windows"',
        "sec-fetch-dest": "empty",
        "sec-fetch-mode": "cors",
        "sec-fetch-site": "same-origin",
        systemid: "Naukri",
        cookie:
          "_t_ds=70658061700460751-967065806-07065806; test=naukri.com; NKWAP=db4fc3d77f3654247ba809e089a4c0fd58822d409817dbb65901a3ad0448c2d9ff003c62a2e1a36431b890266d0ecd01~e57335e68a4c79d57991fe1eeace01ba06af162a82756b4726a28621705d5d90~1~0; MYNAUKRI[UNID]=8cdb4e75d73f4f71b0d8bac441c6b12c; _ff_ds=0142892001703227914-934C4012B761-C90278B377EE; _abck=E7411040D477C6E8C97961E17B0AA04F~0~YAAQhf7UF8jj32aMAQAAPiv9tAvgZVjsT+xsc0yua+94T3ilcs3vl19e9KRK9UmDvf9WCdzp7qSmOf5iumFfsi86zM2xozZaOyOLQQOrB8Nxj0eJeUhmQlhvG4Ik52ziEqeEVQ+UAsvghpz8NEqq09W5s/ouCAvuHnZnYXQEgr3SFFvgguin+SKfHD3V6kwXYOt1fsgH1+eX9HCT4SCJ+qpRbt3O/2ru7kvf+Mu+YKc05OpcjFS7+2MCCrcHKxdl2GNHuMwFSWnrTzJbICe3U8z2FZQv6+DQbN6HqQtQU95Y/SuU59RLry+jJhiZNv+M97JTdcSfuv1WyUEyDCV8iV92Z3pVpBe7CygCUDCXOJocChdnyXZBZZKXHac6ICmf35P3Ksoe0dJMcy895btaFuunT3zq3Efn~-1~-1~-1; _t_r=1030%2F%2F; persona=default; J=0; _gcl_au=1.1.373342456.1714067177; PHPSESSID=hgc8mdc0rj5lj8mv594i3gmk3q; nauk_rt=eyJraWQiOiIxIiwidHlwIjoiSldUIiwiYWxnIjoiUlM1MTIifQ.eyJ1ZF9yZXNJZCI6MTgwNDAzNzg4LCJzdWIiOiIxODYwMDM2OTIiLCJ1ZF91c2VybmFtZSI6ImYxNTg0NTA1MDEuODU5NCIsInVkX2lzRW1haWwiOnRydWUsImlzcyI6IkluZm9FZGdlIEluZGlhIFB2dC4gTHRkLiIsInVzZXJBZ2VudCI6Ik1vemlsbGEvNS4wIChXaW5kb3dzIE5UIDEwLjA7IFdpbjY0OyB4NjQpIEFwcGxlV2ViS2l0LzUzNy4zNiAoS0hUTUwsIGxpa2UgR2Vja28pIENocm9tZS8xMjQuMC4wLjAgU2FmYXJpLzUzNy4zNiIsImlwQWRyZXNzIjoiMjAyLjEzNi43MS4yMyIsInVkX2lzVGVjaE9wc0xvZ2luIjpmYWxzZSwidXNlcklkIjoxODYwMDM2OTIsInN1YlVzZXJUeXBlIjoiam9ic2Vla2VyIiwidXNlclN0YXRlIjoiQVVUSEVOVElDQVRFRCIsInVkX2lzUGFpZENsaWVudCI6ZmFsc2UsInVkX2VtYWlsVmVyaWZpZWQiOnRydWUsInVzZXJUeXBlIjoiam9ic2Vla2VyIiwic2Vzc2lvblN0YXRUaW1lIjoiMjAyNC0wNC0yNVQyMzoxNjozOCIsInVkX2VtYWlsIjoicHJhbmVzaG5hbmdhcmUxMEBnbWFpbC5jb20iLCJ1c2VyUm9sZSI6InVzZXIiLCJleHAiOjE3NDU2MDMxOTgsInRva2VuVHlwZSI6InJlZnJlc2hUb2tlbiIsImlhdCI6MTcxNDA2NzE5OCwianRpIjoiYjRmYzg3MDE4MjhlNGJjOTk4Y2QzY2I2ZmJjODdmNTIifQ.X39x8QC_5uVoD5gCuRxkm5FPBdY_o3eWCJQ1MRAD3Y41pwAA9shUuUd-NZ4z7fThCUeplDJXN4Sgf7eIpHISYTmm48yhSzfBxemYuiXvzQSOY1Gj9Od308mP5cJKjX83DJFEjHqUuHyyQGzl9o7JyBmzdAaRH5sa7rVkiggnjg18N3X3xbl-cJSDlRIS3VDgUy1IrofrHjA-WBFOwqVpK3TLUmTLjHehKmcuai5NkPKtYB7_Z9XTHAnlEiff_orQdVHqAG1Yton5stNq30OK-7UL5MFbh71h8mu5x8RNync-HNvODb-543eosSZZ3gO_u5MlCFIiRF4OrvF-eVyigA; nauk_sid=b4fc8701828e4bc998cd3cb6fbc87f52; nauk_otl=b4fc8701828e4bc998cd3cb6fbc87f52; _ga_T749QGK6MQ=GS1.1.1714067171.1.1.1714067199.0.0.0; nauk_ps=default; PS=e57335e68a4c79d57991fe1eeace01ba06af162a82756b4726a28621705d5d90; failLoginCount=0; ACTIVE=1714187542; _t_ds=70658061700460751-967065806-07065806; nauk_at=eyJraWQiOiIxIiwidHlwIjoiSldUIiwiYWxnIjoiUlM1MTIifQ.eyJ1ZF9yZXNJZCI6MTgwNDAzNzg4LCJzdWIiOiIxODYwMDM2OTIiLCJ1ZF91c2VybmFtZSI6ImYxNTg0NTA1MDEuODU5NCIsInVkX2lzRW1haWwiOnRydWUsImlzcyI6IkluZm9FZGdlIEluZGlhIFB2dC4gTHRkLiIsInVzZXJBZ2VudCI6Ik1vemlsbGEvNS4wIChXaW5kb3dzIE5UIDEwLjA7IFdpbjY0OyB4NjQpIEFwcGxlV2ViS2l0LzUzNy4zNiAoS0hUTUwsIGxpa2UgR2Vja28pIENocm9tZS8xMjQuMC4wLjAgU2FmYXJpLzUzNy4zNiIsImlwQWRyZXNzIjoiMjAyLjEzNi43MS4yMyIsInVkX2lzVGVjaE9wc0xvZ2luIjpmYWxzZSwidXNlcklkIjoxODYwMDM2OTIsInN1YlVzZXJUeXBlIjoiam9ic2Vla2VyIiwidXNlclN0YXRlIjoiQVVUSEVOVElDQVRFRCIsInVkX2VtYWlsVmVyaWZpZWQiOnRydWUsInVkX2lzUGFpZENsaWVudCI6ZmFsc2UsInVzZXJUeXBlIjoiam9ic2Vla2VyIiwic2Vzc2lvblN0YXRUaW1lIjoiMjAyNC0wNC0yNVQyMzoxNjozOCIsInVkX2VtYWlsIjoicHJhbmVzaG5hbmdhcmUxMEBnbWFpbC5jb20iLCJ1c2VyUm9sZSI6InVzZXIiLCJleHAiOjE3MTQyODE1MjEsInRva2VuVHlwZSI6ImFjY2Vzc1Rva2VuIiwiaWF0IjoxNzE0Mjc3OTIxLCJqdGkiOiJiNGZjODcwMTgyOGU0YmM5OThjZDNjYjZmYmM4N2Y1MiJ9.gtlXCP3HOZygE_I66r15hKJV8NAK4qn0GIaSBtWVpgr1-jeRPGzjLacey-2GLNDjEOm63zh7HsgWB-dKkmRy4GdxS4qqs141Ybcae_prQzOEBD4qpqKiHt1nPvdw2mEq4CaxiK69l3jlmEcX0aKFGxXZ1KRFuhAugfXNB3lx3fLS21UrRJf3D1nTcP_ZrYH-hsqphwE01xct6m4MzKab4HtO_3vpm-geVdUVg9rMV57YBibqSQkxabg8bUXuWmHcCZ5NMU0xzSPmkN5I3K0IeSOJNuTJDHC-MzEH96AWVo23xIRjCuT7iIDH9kKQeZFbXSDo9Pq3Ib0KU-KfUMAD3w; is_login=1; bm_mi=1C948587990FB9FBA4C22928AD29BB50~YAAQj/7UF6Y9qNGOAQAAWjLtIhepS/jWat2hY1B01QG7J2tolPOShbqSaP2hcU/a8QbwGQJ+mBwE2jizXqbNmL06FX1xV2qLE+xnqi0lJ5EIqKEd7JMuZqEHFwVHyrnl8Hk5tKkN4ruLbQpR7Uu2BlbCkU+NNkatKigdYv8o6ajlKeIWtf1DD3TLmA2Q+BhEqj0ux6ikzlBJy5Zd6w2P+QcgHZwh/iZxqH+GV9F2X1gZSNnoiDK5BOaG+v678V90fDUVtkyDCF+iEAAKO4tc/PsuXJ/njNqn3nQjgD9NQm73t48qHb7XnsgMjPGTi42iFerKA2/j9dgyX7/9~1; ak_bmsc=846DD46392B0310751DEA749E2379E51~000000000000000000000000000000~YAAQj/7UF/09qNGOAQAAuDbtIhfElrhYBy/92mVF3dUGENtEizaBaKOS8xbW7bTEjA5V11GIGWwTBcuGlmgAP3lhsq1I5klHC0VBvLOB/gKpZE2Wy+2dgXf96ju+SeUfw1FcAyfJjojwUcUHwS2BrTClnyP5NeLKVWc/gWU7tCDhj/z/GytxGmKy+uebM/RRpJsCHrUvovui1amSVFcRxp5PQTvxxFc3gu8lGRR64hKeiGXhZGnQ5vtoOig3zrsqGSeIrp0vLUaTYOsluvW2ALXhIkFC/gcfKkgbm72+QlA3tb4Indwx4KyNVK8wGdFD8Lnx8jJb4iX28HDGOADVeOg3BgQ/qfFbqVrjxQiXLH4R6KpatE4H7MNBsqw76amXuc5yCg1oIJzMb4H/L+QG8/a3sItgqb/JreU022hoLrPSMmR6cBZubh01BcqPH4Q0n72KimI0Pb2+WJsEry/liwuRnp2unTtGUD5Cjn+2FDzXiNKvn6W8tJ11EgvH; _ga=GA1.1.592942086.1714067166; __gads=ID=4f454b8d75c80fdb:T=1714067252:RT=1714278794:S=ALNI_MYGCavsrzaOV11nzP0lOXY0_fSuoA; __gpi=UID=00000dfb0de65670:T=1714067252:RT=1714278794:S=ALNI_Mbt_-Bofq1uO9uu7xQR21VS5J9SzQ; __eoi=ID=d275092e06f17c78:T=1714067252:RT=1714278794:S=AA-AfjZVqAJpsAwpnTkgYwgoXBwX; bm_sv=38CC44BC5CE5C6A49FCEB4BAEA7980ED~YAAQj/7UF8jZqdGOAQAAWRP8IheL7KnJCKaQXkBDplbMZVV6KOLs6+Ul++nFSfpBSldOutc9QMtYZOHORS5qv/2gaxKX2FSooAap3vINpmIfUVL4IoTx6FR1Swj7OadpaJXwa5Duxd8R+S4yuN83YheKsKoOzl798g18YJGEkVhfaPM+8PNnQoUBtSVVOQr9/CZdIGQ6WpZpogkuOCCA3uWb7raej5KQAAT+MQn7ypo24LbkxGKBdmXVb0o/5pWPCw==~1; HOWTORT=ul=1714278896306&r=https%3A%2F%2Fwww.naukri.com%2Fjob-listings-react-js-developer-nimbusnext-pune-2-to-5-years-250424501645%3Fsrc%3DjobsearchDesk%26sid%3D1714278791789807%26xp%3D1%26px%3D1&hd=1714278896596&cl=1714278884930&nu=https%3A%2F%2Fwww.naukri.com%2Fjob-listings-react-js-developer-nimbusnext-pune-2-to-5-years-250424501645%3Fsrc%3DjobsearchDesk%26sid%3D1714278791789807%26xp%3D1%26px%3D1; _ga_K2YBNZVRLL=GS1.1.1714277924.4.1.1714278896.51.0.0",
        Referer:
          "https://www.naukri.com/job-listings-react-js-developer-nimbusnext-pune-2-to-5-years-250424501645?src=jobsearchDesk&sid=1714278791789807&xp=1&px=1",
        "Referrer-Policy": "strict-origin-when-cross-origin",
      },
      body: null,
      method: "GET",
    }
  );

const getSimJobsAPI = (jobId, authorization = accessToken) =>
  fetch(
    `https://www.naukri.com/jobapi/v2/search/simjobs/${jobId}?noOfResults=6&searchType=sim`,
    {
      headers: {
        accept: "application/json",
        "accept-language": "en-IN,en-GB;q=0.9,en-US;q=0.8,en;q=0.7",
        appid: "121",
        authorization: `Bearer ${authorization}`,
        "cache-control": "no-cache",
        clientid: "d3skt0p",
        "content-type": "application/json",
        gid: "LOCATION,INDUSTRY,EDUCATION,FAREA_ROLE",
        pragma: "no-cache",
        priority: "u=1, i",
        "sec-ch-ua":
          '"Chromium";v="124", "Google Chrome";v="124", "Not-A.Brand";v="99"',
        "sec-ch-ua-mobile": "?0",
        "sec-ch-ua-platform": '"Windows"',
        "sec-fetch-dest": "empty",
        "sec-fetch-mode": "cors",
        "sec-fetch-site": "same-origin",
        systemid: "Naukri",
        cookie:
          "_t_ds=70658061700460751-967065806-07065806; test=naukri.com; NKWAP=db4fc3d77f3654247ba809e089a4c0fd58822d409817dbb65901a3ad0448c2d9ff003c62a2e1a36431b890266d0ecd01~e57335e68a4c79d57991fe1eeace01ba06af162a82756b4726a28621705d5d90~1~0; MYNAUKRI[UNID]=8cdb4e75d73f4f71b0d8bac441c6b12c; _ff_ds=0142892001703227914-934C4012B761-C90278B377EE; _abck=E7411040D477C6E8C97961E17B0AA04F~0~YAAQhf7UF8jj32aMAQAAPiv9tAvgZVjsT+xsc0yua+94T3ilcs3vl19e9KRK9UmDvf9WCdzp7qSmOf5iumFfsi86zM2xozZaOyOLQQOrB8Nxj0eJeUhmQlhvG4Ik52ziEqeEVQ+UAsvghpz8NEqq09W5s/ouCAvuHnZnYXQEgr3SFFvgguin+SKfHD3V6kwXYOt1fsgH1+eX9HCT4SCJ+qpRbt3O/2ru7kvf+Mu+YKc05OpcjFS7+2MCCrcHKxdl2GNHuMwFSWnrTzJbICe3U8z2FZQv6+DQbN6HqQtQU95Y/SuU59RLry+jJhiZNv+M97JTdcSfuv1WyUEyDCV8iV92Z3pVpBe7CygCUDCXOJocChdnyXZBZZKXHac6ICmf35P3Ksoe0dJMcy895btaFuunT3zq3Efn~-1~-1~-1; _t_r=1030%2F%2F; persona=default; J=0; _gcl_au=1.1.373342456.1714067177; PHPSESSID=hgc8mdc0rj5lj8mv594i3gmk3q; nauk_rt=eyJraWQiOiIxIiwidHlwIjoiSldUIiwiYWxnIjoiUlM1MTIifQ.eyJ1ZF9yZXNJZCI6MTgwNDAzNzg4LCJzdWIiOiIxODYwMDM2OTIiLCJ1ZF91c2VybmFtZSI6ImYxNTg0NTA1MDEuODU5NCIsInVkX2lzRW1haWwiOnRydWUsImlzcyI6IkluZm9FZGdlIEluZGlhIFB2dC4gTHRkLiIsInVzZXJBZ2VudCI6Ik1vemlsbGEvNS4wIChXaW5kb3dzIE5UIDEwLjA7IFdpbjY0OyB4NjQpIEFwcGxlV2ViS2l0LzUzNy4zNiAoS0hUTUwsIGxpa2UgR2Vja28pIENocm9tZS8xMjQuMC4wLjAgU2FmYXJpLzUzNy4zNiIsImlwQWRyZXNzIjoiMjAyLjEzNi43MS4yMyIsInVkX2lzVGVjaE9wc0xvZ2luIjpmYWxzZSwidXNlcklkIjoxODYwMDM2OTIsInN1YlVzZXJUeXBlIjoiam9ic2Vla2VyIiwidXNlclN0YXRlIjoiQVVUSEVOVElDQVRFRCIsInVkX2lzUGFpZENsaWVudCI6ZmFsc2UsInVkX2VtYWlsVmVyaWZpZWQiOnRydWUsInVzZXJUeXBlIjoiam9ic2Vla2VyIiwic2Vzc2lvblN0YXRUaW1lIjoiMjAyNC0wNC0yNVQyMzoxNjozOCIsInVkX2VtYWlsIjoicHJhbmVzaG5hbmdhcmUxMEBnbWFpbC5jb20iLCJ1c2VyUm9sZSI6InVzZXIiLCJleHAiOjE3NDU2MDMxOTgsInRva2VuVHlwZSI6InJlZnJlc2hUb2tlbiIsImlhdCI6MTcxNDA2NzE5OCwianRpIjoiYjRmYzg3MDE4MjhlNGJjOTk4Y2QzY2I2ZmJjODdmNTIifQ.X39x8QC_5uVoD5gCuRxkm5FPBdY_o3eWCJQ1MRAD3Y41pwAA9shUuUd-NZ4z7fThCUeplDJXN4Sgf7eIpHISYTmm48yhSzfBxemYuiXvzQSOY1Gj9Od308mP5cJKjX83DJFEjHqUuHyyQGzl9o7JyBmzdAaRH5sa7rVkiggnjg18N3X3xbl-cJSDlRIS3VDgUy1IrofrHjA-WBFOwqVpK3TLUmTLjHehKmcuai5NkPKtYB7_Z9XTHAnlEiff_orQdVHqAG1Yton5stNq30OK-7UL5MFbh71h8mu5x8RNync-HNvODb-543eosSZZ3gO_u5MlCFIiRF4OrvF-eVyigA; nauk_sid=b4fc8701828e4bc998cd3cb6fbc87f52; nauk_otl=b4fc8701828e4bc998cd3cb6fbc87f52; _ga_T749QGK6MQ=GS1.1.1714067171.1.1.1714067199.0.0.0; nauk_ps=default; PS=e57335e68a4c79d57991fe1eeace01ba06af162a82756b4726a28621705d5d90; failLoginCount=0; ACTIVE=1714187542; _t_ds=70658061700460751-967065806-07065806; nauk_at=eyJraWQiOiIxIiwidHlwIjoiSldUIiwiYWxnIjoiUlM1MTIifQ.eyJ1ZF9yZXNJZCI6MTgwNDAzNzg4LCJzdWIiOiIxODYwMDM2OTIiLCJ1ZF91c2VybmFtZSI6ImYxNTg0NTA1MDEuODU5NCIsInVkX2lzRW1haWwiOnRydWUsImlzcyI6IkluZm9FZGdlIEluZGlhIFB2dC4gTHRkLiIsInVzZXJBZ2VudCI6Ik1vemlsbGEvNS4wIChXaW5kb3dzIE5UIDEwLjA7IFdpbjY0OyB4NjQpIEFwcGxlV2ViS2l0LzUzNy4zNiAoS0hUTUwsIGxpa2UgR2Vja28pIENocm9tZS8xMjQuMC4wLjAgU2FmYXJpLzUzNy4zNiIsImlwQWRyZXNzIjoiMjAyLjEzNi43MS4yMyIsInVkX2lzVGVjaE9wc0xvZ2luIjpmYWxzZSwidXNlcklkIjoxODYwMDM2OTIsInN1YlVzZXJUeXBlIjoiam9ic2Vla2VyIiwidXNlclN0YXRlIjoiQVVUSEVOVElDQVRFRCIsInVkX2VtYWlsVmVyaWZpZWQiOnRydWUsInVkX2lzUGFpZENsaWVudCI6ZmFsc2UsInVzZXJUeXBlIjoiam9ic2Vla2VyIiwic2Vzc2lvblN0YXRUaW1lIjoiMjAyNC0wNC0yNVQyMzoxNjozOCIsInVkX2VtYWlsIjoicHJhbmVzaG5hbmdhcmUxMEBnbWFpbC5jb20iLCJ1c2VyUm9sZSI6InVzZXIiLCJleHAiOjE3MTQyODE1MjEsInRva2VuVHlwZSI6ImFjY2Vzc1Rva2VuIiwiaWF0IjoxNzE0Mjc3OTIxLCJqdGkiOiJiNGZjODcwMTgyOGU0YmM5OThjZDNjYjZmYmM4N2Y1MiJ9.gtlXCP3HOZygE_I66r15hKJV8NAK4qn0GIaSBtWVpgr1-jeRPGzjLacey-2GLNDjEOm63zh7HsgWB-dKkmRy4GdxS4qqs141Ybcae_prQzOEBD4qpqKiHt1nPvdw2mEq4CaxiK69l3jlmEcX0aKFGxXZ1KRFuhAugfXNB3lx3fLS21UrRJf3D1nTcP_ZrYH-hsqphwE01xct6m4MzKab4HtO_3vpm-geVdUVg9rMV57YBibqSQkxabg8bUXuWmHcCZ5NMU0xzSPmkN5I3K0IeSOJNuTJDHC-MzEH96AWVo23xIRjCuT7iIDH9kKQeZFbXSDo9Pq3Ib0KU-KfUMAD3w; is_login=1; bm_mi=1C948587990FB9FBA4C22928AD29BB50~YAAQj/7UF6Y9qNGOAQAAWjLtIhepS/jWat2hY1B01QG7J2tolPOShbqSaP2hcU/a8QbwGQJ+mBwE2jizXqbNmL06FX1xV2qLE+xnqi0lJ5EIqKEd7JMuZqEHFwVHyrnl8Hk5tKkN4ruLbQpR7Uu2BlbCkU+NNkatKigdYv8o6ajlKeIWtf1DD3TLmA2Q+BhEqj0ux6ikzlBJy5Zd6w2P+QcgHZwh/iZxqH+GV9F2X1gZSNnoiDK5BOaG+v678V90fDUVtkyDCF+iEAAKO4tc/PsuXJ/njNqn3nQjgD9NQm73t48qHb7XnsgMjPGTi42iFerKA2/j9dgyX7/9~1; ak_bmsc=846DD46392B0310751DEA749E2379E51~000000000000000000000000000000~YAAQj/7UF/09qNGOAQAAuDbtIhfElrhYBy/92mVF3dUGENtEizaBaKOS8xbW7bTEjA5V11GIGWwTBcuGlmgAP3lhsq1I5klHC0VBvLOB/gKpZE2Wy+2dgXf96ju+SeUfw1FcAyfJjojwUcUHwS2BrTClnyP5NeLKVWc/gWU7tCDhj/z/GytxGmKy+uebM/RRpJsCHrUvovui1amSVFcRxp5PQTvxxFc3gu8lGRR64hKeiGXhZGnQ5vtoOig3zrsqGSeIrp0vLUaTYOsluvW2ALXhIkFC/gcfKkgbm72+QlA3tb4Indwx4KyNVK8wGdFD8Lnx8jJb4iX28HDGOADVeOg3BgQ/qfFbqVrjxQiXLH4R6KpatE4H7MNBsqw76amXuc5yCg1oIJzMb4H/L+QG8/a3sItgqb/JreU022hoLrPSMmR6cBZubh01BcqPH4Q0n72KimI0Pb2+WJsEry/liwuRnp2unTtGUD5Cjn+2FDzXiNKvn6W8tJ11EgvH; _ga=GA1.1.592942086.1714067166; __gads=ID=4f454b8d75c80fdb:T=1714067252:RT=1714277964:S=ALNI_MYGCavsrzaOV11nzP0lOXY0_fSuoA; __gpi=UID=00000dfb0de65670:T=1714067252:RT=1714277964:S=ALNI_Mbt_-Bofq1uO9uu7xQR21VS5J9SzQ; __eoi=ID=d275092e06f17c78:T=1714067252:RT=1714277964:S=AA-AfjZVqAJpsAwpnTkgYwgoXBwX; bm_sv=38CC44BC5CE5C6A49FCEB4BAEA7980ED~YAAQj/7UF6sXqdGOAQAAZ0T1IhdLydjGLfOZ/GGCxy0CpN8WGig0NE9hzExkQagtqgXeq2KomPV0z1RQatxz51gSRSh2ldOokVa5p8tAqHhNYkr34tgXk2lmbxS602v8z6mNgXv4hO3moAg5PpPfU1CO6mN7in1RJmKON66ffwMmfWgnM4pMN/+Hktqb5vo05HA1NSkp09gV/ZL6hnuXIirKME56I23OLUhtftifnH6BHCEDSHIB13j1mzfvB5pXMw==~1; HOWTORT=ul=1714278450112&r=https%3A%2F%2Fwww.naukri.com%2Fjob-listings-react-js-developer-neoscript-mumbai-2-to-5-years-120123500005%3Fsrc%3DjobsearchDesk%26sid%3D17142779601986167_1%26xp%3D19%26px%3D2%26nignbevent_src%3DjobsearchDeskGNB&hd=1714278450288&cl=1714278437026&nu=https%3A%2F%2Fwww.naukri.com%2Fjob-listings-react-js-developer-neoscript-mumbai-2-to-5-years-120123500005%3Fsrc%3DjobsearchDesk%26sid%3D17142779601986167_1%26xp%3D19%26px%3D2%26nignbevent_src%3DjobsearchDeskGNB; _ga_K2YBNZVRLL=GS1.1.1714277924.4.1.1714278450.40.0.0",
        Referer:
          "https://www.naukri.com/job-listings-react-js-developer-neoscript-mumbai-2-to-5-years-120123500005?src=jobsearchDesk&sid=17142779601986167_1&xp=19&px=2&nignbevent_src=jobsearchDeskGNB",
        "Referrer-Policy": "strict-origin-when-cross-origin",
      },
      body: null,
      method: "GET",
    }
  );

const loginAPI = (creds) =>
  fetch("https://www.naukri.com/central-login-services/v1/login", {
    headers: {
      accept: "application/json",
      "accept-language": "en-US,en;q=0.9,en-IN;q=0.8",
      appid: "103",
      "cache-control": "no-cache",
      clientid: "d3skt0p",
      "content-type": "application/json",
      priority: "u=1, i",
      "sec-ch-ua":
        '"Chromium";v="130", "Microsoft Edge";v="130", "Not?A_Brand";v="99"',
      "sec-ch-ua-mobile": "?0",
      "sec-ch-ua-platform": '"Windows"',
      "sec-fetch-dest": "empty",
      "sec-fetch-mode": "cors",
      "sec-fetch-site": "same-origin",
      systemid: "jobseeker",
      cookie:
        "test=naukri.com; _ff_ds=0397941001694712621-F02047019E3D-06F5008B33C1; _ga_K2YBNZVRLL=deleted; _ga_K2YBNZVRLL=GS1.1.1697089325.9.1.1697092657.29.0.0; _clck=14rvhop%7C2%7Cfgz%7C0%7C1368; _uetvid=e514c4805f5211ee92de6dd6e7272fb5; _abck=13520BFFE0D1585028C0B7C52D422A25~0~YAAQxP7UF5bJYV2MAQAAxWrcmws5sNSwQ/WHs1+ASfBkOVV+vCI1xKNbdNUx4qe7X3ZFq4GAa2biNolZaADf9IFgQIzeeHm5v7odhkjGI6uCq7f61vkQ+ip4Nae1cWzrW/DtaZ9gZ6su8msUMntTikR+DYXZPYnuLZ+B5KYNsQldBpvui02dU3iNlV9/NL+xInwMprs1QjLCfzlnNtwPaGprStam/JnaPAvZ4Xft03DCzfOvhHrrQIeIhURyOBTu/b/92FZPkOoWu7gMIQ4B9D5p7adxjk/6ZNsRX+P48JF/eXTczGfq3BhC3wCKbvstMHCNrxACNdVciir7B7ROmcUg0RHnawFlH+Um8PQ9ctPpbmt0GMpIJ5G/TCg3qjO0CMxq3kymo0wrbJljTGHVfuOJx8H6Z801OQ==~-1~-1~-1; G_ENABLED_IDPS=google; J=0; _t_ds=2887e6f91720719158-72887e6f9-02887e6f9; PS=d3b93c2c63a56addf7ee3f3eb7ec36caa984ce74f6c419c7036236208cfe862c0d2edc7f8cdb03e042e212290003989e; jd=050724501244; __gads=ID=ba1ec8d9e208a18f:T=1720754294:RT=1721757847:S=ALNI_MaiEQF_wdYiA6YBnNapaXp_k5ZBGA; __gpi=UID=00000e8dcfec0e9b:T=1720754294:RT=1721757847:S=ALNI_MZpPoZrEE4dwtePNTQB5xFo1FRcxg; __eoi=ID=933b6cefd8fd0aa2:T=1720754294:RT=1721757847:S=AA-AfjaiSOCtSktkf2GOw6mEj-ki; MYNAUKRI[UNID]=8cdb4e75d73f4f71b0d8bac441c6b12c; _gcl_au=1.1.1649700848.1729753059; promobnr=FASTJOB20; _ga_89XHHLE6WS=GS1.1.1730397222.3.0.1730397222.0.0.0; tStp=1731040202945; ACTIVE=1731040203; PHPSESSID=ps3hactvt3jf1uqis85eelmfag; _t_s=direct; test=naukri.com; _gid=GA1.2.1282571293.1731085809; bm_mi=D0FA7CA7E567BA60EEAFCDDAFC38E4B4~YAAQfP7UFwYtc9WSAQAAuYAnDxldZdKGx0nI1j+r5htZvAc2m0qowNHvJVXRnmK45lFyMt6isUqL0tdHSuaA4Q6YdU2fKhpj3dRvp1sKPpGFX1I5pmf3aDwMNnEH2nS9WOH3mE0CWEGO1irvm1rBKtthRPe5gCBAnCQTYl4GQ/cMUS6gDVQ4LH+qkyzoqj6VxTgjhBiceKJzZaIz7t4wsJ533KEGmyo+Y2L5CugpnSp6HLebA7VSAdTX+O4S/MpEHU1MyzORGmJLKty0Z2+4qEESjLlBL6mXSrBntgBd9N9v7XKGrR5ddZbnP125ZesWLA0NDHAcAcpqPFiL~1; ak_bmsc=E0A10F3594904C4114F6CAC72277F325~000000000000000000000000000000~YAAQfP7UF0wtc9WSAQAAGYQnDxk30mxEPPA6KiOeohG0VYUf3BsmUj+ckMeDg8LW0E2HctQbAkwrTnwOpiygxsFHWYzOhrwwQnRz5YQUfQUYnK5YfsUPBByOG84F3H5NTqry8xzL/sntapEvXXFabeNwQiZ/a+CEa80jr0X5Jx9UbNkFgK+7luQI3Dfyeb60q6JW2/4Cz9yBMTJIXo2l3mH6XB4NbDewCyV0LKOW7X3+w+Ykd4d5HW9UmUfpgIlNLJECDcldSN79bpH1miGdv39rowZ62AxAIeV2g0dBoK3e5TJgk/q54xztFls/i7kfv3R3dt1el9N5Sd8IIDIgoEdoPs6n79qocDZJQkTPRIkj7cb3qne/I58lz7tAnYaGPILnO9p3A68K8MmtH5Qz1zLg2jQ3e+Y9I7MQOxBc9EthQOrA5OpeCgEBrXh6+WcWSNHVlGewP5XpJ2wtBSakghvDuC0jlBg8PG3mLT9YOQbQOOiP7wmmt1FoeHA1; _ga=GA1.1.1059502748.1693417959; _t_us=672EE56E; _t_r=1030%2F%2F; persona=default; HOWTORT=cl=1731126639727&r=https%3A%2F%2Fwww.naukri.com%2F&ul=1731126637439&hd=1731126637547&nu=https%3A%2F%2Flogin.naukri.com%2FnLogin%2FLogin.php; bm_sv=57EE7DA758E8C7B8BBCE8D0C51521C38~YAAQh/7UFyo5k72SAQAA2kowDxmeDVfrdevB1FDYEn9da5CklJmhLLz8q9OF0VZnD2LVDACc3pk5jEFs8HUx4PDLjv7zBPb0Pq3QjLDxQwGmZ6F1veXSKcSJzBwg748xncZLrCBJ0bMDuEwYOMkUew5/DjTuBznJD9yQ90k0fbSyQe0N13O3gG6rnynpwBx2TttcMpLkT0b79qVbH0UMxVWdZe9QlDMvCqptiJBOPxvX4Io/V4B/KiDsbtFH1KtAKg==~1; _ga_K2YBNZVRLL=GS1.1.1731126067.22.1.1731126654.43.0.0; _ga_T749QGK6MQ=GS1.1.1731126638.3.0.1731126654.0.0.0",
      Referer: "https://www.naukri.com/",
      "Referrer-Policy": "strict-origin-when-cross-origin",
    },
    body: '{"username":"praneshnangare10@gmail.com","password":"Pran@1653"}',
    method: "POST",
  });

module.exports = {
  applyJobsAPI,
  searchJobsAPI,
  getJobDetailsAPI,
  getSimJobsAPI,
  loginAPI,
};
