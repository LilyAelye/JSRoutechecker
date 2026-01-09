/**
 * 
 * @param {object} params
 * @param {HTMLElement} params.location
 * @param {string} params.routes
 * @param {string | number} params.filterby filter (string : route_name or number : status code)
 * @param {boolean} params.timeout Should timeout?
 * @return {string} result of our emulation of routes
 * 
 *  
*/
function Emulate(params) {
    let f = 0, s = 0, t = 0, pt = 0;
    let failed_routes = [] // [ {route, code text} ]
    let results = [];
    let routes = [];

    // Parse string routes properly
    if (typeof params.routes === "string") {
        routes = params.routes
            .replaceAll("[","")
            .replaceAll("]","")
            .split(",")
            .map(r => {
                // Remove quotes, HTML entities, trim
                return r.replace(/['"&lt;&gt;]/g, '').trim();
            })
            .filter(r => r); // remove empty
    } else if (Array.isArray(params.routes)) {
        routes = params.routes;
    }

    // Use Promise.all to wait for all fetches
    return Promise.all(routes.map(route =>
        fetch(route)
        .then(resp => {
            if (params.filterby !== undefined) {
                if (typeof params.filterby === "number" && resp.status !== params.filterby) return;
                if (typeof params.filterby === "string" && !route.includes(params.filterby)) return;
            }
            results.push(`Route: ${route} | S: ${resp.status} | ST: ${resp.statusText}`);
            if (resp.status === 200) s++; else if (resp.status === 206) pt++;  else f++, failed_routes.push({r:route, status_t:resp.statusText});
            t++;
        })
        .catch(err => {
            results.push(`Route: ${route} | Error: ${err}`);
            f++;
            t++;
        })
    )).then(() => {
        let data = "";
        function append_data(p){ data += p.label+": "+p.result+"\n"; }
        append_data({label:"⇒", result:t});
        append_data({label:"✔", result:s});
        append_data({label:"✘", result:f});
        append_data({label:"◇", result:routes.length});
        console.warn(data);
        if (params.location) {
            var makelabel = function(prams) {
                var nw_htl = document.createElement("h5")
                nw_htl.innerText = prams.text
                params.location.appendChild(nw_htl)
                return nw_htl
            }
            console.log(s, f)
            makelabel({text:"Success: "+String(s)})
            makelabel({text:"Failed: "+String(f)})
            failed_routes.forEach(froute => {
                var route = froute.r
                var statustext = froute.status_t
                makelabel({text: "[Failed] "+route + " | "+ statustext})
            });
            makelabel({text:"Partial Response (206): "+String(pt)})
        }
        return data;
    });
}
