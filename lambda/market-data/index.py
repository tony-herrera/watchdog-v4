import json
import urllib.request
import urllib.error

def handler(event, context):
    print(f"⚡ [Lambda] Received execution event: {json.dumps(event)}")
    
    # 1. Extract the ticker from the Next.js Fargate payload
    ticker = event.get('ticker', '').upper()
    if not ticker:
        return {
            'statusCode': 400,
            'body': json.dumps({'error': 'Missing required parameter: ticker'})
        }

    # 2. Execute the out-bound network request
    # Using Yahoo Finance's public chart API for real-time market data
    url = f"https://query1.finance.yahoo.com/v8/finance/chart/{ticker}?interval=1d&range=1d"
    req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})

    try:
        with urllib.request.urlopen(req, timeout=5) as response:
            data = json.loads(response.read().decode())
            
            # 3. Parse the complex financial payload
            result = data['chart']['result'][0]
            current_price = result['meta']['regularMarketPrice']
            previous_close = result['meta']['chartPreviousClose']
            
            # Calculate simple trend
            trend = "BULLISH" if current_price > previous_close else "BEARISH"

            payload = {
                "ticker": ticker,
                "price": current_price,
                "trend": trend,
                "source": "AWS_Lambda_MarketData_Worker"
            }
            
            print(f"✅ [Lambda] Successfully retrieved data for {ticker}: {current_price}")
            
            return {
                'statusCode': 200,
                'body': json.dumps(payload)
            }

    except urllib.error.URLError as e:
        print(f"❌ [Lambda] Network execution failed: {str(e)}")
        return {
            'statusCode': 502,
            'body': json.dumps({'error': 'External financial API is unreachable.'})
        }
    except Exception as e:
        print(f"❌ [Lambda] Data parsing failed: {str(e)}")
        return {
            'statusCode': 500,
            'body': json.dumps({'error': 'Failed to process market data.'})
        }