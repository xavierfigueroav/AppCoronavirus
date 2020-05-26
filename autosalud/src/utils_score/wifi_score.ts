export class WifiScore{
    get_wifi_score_signal_intensity(available_networks, max_signal_intensity=5): number{
        let number_networks_available = available_networks.length;
        
        if(number_networks_available>0){
            const maximum_signal_intensity = max_signal_intensity;
            let signal_intensity = 0;
            console.log("Number of networks available: "+number_networks_available)
        
            for(let network of available_networks){
                console.log("Network "+ network["BSSID"] +": "+network["level"]);
                signal_intensity += network["level"];
            }
            
            let signal_intensity_average = signal_intensity/number_networks_available
            let signal_intensity_score = (signal_intensity_average/maximum_signal_intensity).toFixed(2)
            console.log("Final(average) score: "+signal_intensity_score)
            return Number(signal_intensity_score);
        }
        else 
            console.log("No WiFi networks detected at the moment.");
        return 1;
    }
    
    get_wifi_score_networks_available(number_networks_available, X=1.5, number_home_networks): number{
        if(number_networks_available>0){
            console.log("Number of networks available: "+number_networks_available)
            var max_networks_allowed = number_home_networks*X;
            if(number_networks_available>=max_networks_allowed)
                return 1;
            else{
                let networks_available_score = (number_networks_available/max_networks_allowed).toFixed(2);
                return Number(networks_available_score);
            }
        }
        else
            console.log("No WiFi networks detected at the moment.");
        return 1;
    }
}