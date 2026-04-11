import { requestMarketHistory, requestVolumeProfile } from '../../integrations/ai_client.js';

class MarketService {
  async getHistory(startDate = '2024-01-01') {
    const aiResponse = await requestMarketHistory(startDate);
    // aiResponse = { success, data: [...] } hoặc trực tiếp array
    return Array.isArray(aiResponse) ? aiResponse : aiResponse.data;
  }

  async getVolumeProfile(bins = 10) {
    const response = await requestVolumeProfile(bins);
    return response.data;
  }
}

export default new MarketService();
