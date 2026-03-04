import { WeatherForecast, DetailedForecast } from '../types';

const WEATHER_API_KEY = 'c7f76605724ecafb54933077ede4166a';
const LAT = 41.442;
const LON = -8.723;

const mapCondition = (id: number): 'sunny' | 'cloudy' | 'rain' | 'storm' => {
    if (id >= 200 && id < 300) return 'storm';
    if (id >= 300 && id < 600) return 'rain';
    if (id >= 801) return 'cloudy';
    return 'sunny';
};

export const weatherService = {
    async getForecast(): Promise<{ dailyData: WeatherForecast[], sprayData: DetailedForecast[] }> {
        const currentRes = await fetch(`https://api.openweathermap.org/data/2.5/weather?lat=${LAT}&lon=${LON}&units=metric&lang=pt&appid=${WEATHER_API_KEY}`);
        const current = await currentRes.json();

        const forecastRes = await fetch(`https://api.openweathermap.org/data/2.5/forecast?lat=${LAT}&lon=${LON}&units=metric&lang=pt&appid=${WEATHER_API_KEY}`);
        const forecast = await forecastRes.json();

        const sprayData: DetailedForecast[] = forecast.list.slice(0, 8).map((item: any) => ({
            dt: item.dt,
            temp: Math.round(item.main.temp),
            windSpeed: Math.round(item.wind.speed * 3.6),
            humidity: item.main.humidity,
            rainProb: Math.round(item.pop * 100)
        }));

        const dailyData: WeatherForecast[] = [];
        dailyData.push({
            day: 'Hoje',
            temp: Math.round(current.main.temp),
            condition: mapCondition(current.weather[0].id),
            description: current.weather[0].description,
            windSpeed: Math.round(current.wind.speed * 3.6),
            humidity: current.main.humidity
        });

        const processedDays = new Set<string>();
        const todayDate = new Date().getDate();

        forecast.list.forEach((item: any) => {
            const date = new Date(item.dt * 1000);
            const dateNum = date.getDate();
            const dayName = date.toLocaleDateString('pt-PT', { weekday: 'short' }).replace('.', '');
            const hour = date.getHours();

            if (dateNum !== todayDate && !processedDays.has(dayName)) {
                if (hour >= 11 && hour <= 15) {
                    dailyData.push({
                        day: dayName.charAt(0).toUpperCase() + dayName.slice(1),
                        temp: Math.round(item.main.temp),
                        condition: mapCondition(item.weather[0].id),
                        description: item.weather[0].description,
                        windSpeed: Math.round(item.wind.speed * 3.6),
                        humidity: item.main.humidity
                    });
                    processedDays.add(dayName);
                }
            }
        });

        // Retornar apenas os primeiros 5 dias
        return {
            dailyData: dailyData.slice(0, 5),
            sprayData
        };
    }
};
