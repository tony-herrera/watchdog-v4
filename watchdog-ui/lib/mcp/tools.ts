export const WATCHDOG_MCP_TOOLS = [
  {
    name: 'fetch_stock_price',
    description: 'Fetches the current, real-time trading price and basic daily market data for a given stock ticker symbol. Use this when the user asks for a quick price check or current market status.',
    inputSchema: {
      type: 'object',
      properties: {
        ticker_symbol: {
          type: 'string',
          description: 'The standard stock ticker symbol (e.g., NVDA, AAPL, TSLA). MUST be uppercase.',
        },
      },
      required: ['ticker_symbol'],
    },
  },
  {
    name: 'generate_technical_chart',
    description: 'Generates a visual technical analysis chart (PNG) and returns the secure S3 URL for multimodal grounding. Use this ONLY when the user explicitly asks to "see", "chart", "graph", or "visualize" a stock\'s performance or technical indicators.',
    inputSchema: {
      type: 'object',
      properties: {
        ticker_symbol: {
          type: 'string',
          description: 'The standard stock ticker symbol (e.g., NVDA, AAPL, TSLA).',
        },
        chart_type: {
          type: 'string',
          enum: ['simple_moving_average', 'macd', 'bollinger_bands', 'volume_profile'],
          description: 'The specific technical indicator to overlay on the chart. If the user does not specify, default to simple_moving_average.',
        },
        time_window: {
          type: 'integer',
          description: 'The number of days to look back for the chart data. Defaults to 30 if not specified.',
          default: 30
        }
      },
      required: ['ticker_symbol', 'chart_type'],
    },
  }
];