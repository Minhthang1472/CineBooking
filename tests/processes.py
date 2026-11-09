# -*- coding: utf-8 -*-
"""
Helper library for Robot Framework: ProcessLib (processes.py)
Provides:
1. run_command: Run shell commands
2. db_scalar: Run SQL scalar query with UTF-8 support
3. check_has_pages: Safely check if Browser has open pages
4. raw_get, raw_post, raw_put, raw_patch, raw_delete: Safe HTTP requests
   with automatic JSON serialization, Content-Type headers,
   and AttrDict responses (.token, ['token'], .id, ['id']).
"""
import subprocess
import requests
import json

class AttrDict(dict):
    """Dict subclass that allows attribute access like obj.token or obj.id"""
    def __getattr__(self, name):
        if name in self:
            val = self[name]
            return AttrDict(val) if isinstance(val, dict) else val
        return None

    def __setattr__(self, name, value):
        self[name] = value

class ApiResponse:
    def __init__(self, resp):
        self.status_code = resp.status_code
        self.text = resp.text
        self._resp = resp
        try:
            parsed = resp.json()
            if isinstance(parsed, dict):
                self._json = AttrDict(parsed)
            elif isinstance(parsed, list):
                self._json = [AttrDict(x) if isinstance(x, dict) else x for x in parsed]
            else:
                self._json = parsed
        except Exception:
            self._json = AttrDict()

    def json(self):
        return self._json

    @property
    def token(self):
        if isinstance(self._json, dict):
            return self._json.get('token', '')
        return ''

    @property
    def id(self):
        if isinstance(self._json, dict):
            if 'id' in self._json and self._json['id'] is not None:
                return self._json['id']
            if 'Id' in self._json and self._json['Id'] is not None:
                return self._json['Id']
            data = self._json.get('data')
            if isinstance(data, dict):
                return data.get('id') or data.get('Id') or 0
            if isinstance(data, list) and len(data) > 0 and isinstance(data[0], dict):
                return data[0].get('id') or data[0].get('Id') or 0
            return 0
        if isinstance(self._json, list) and len(self._json) > 0 and isinstance(self._json[0], dict):
            return self._json[0].get('id') or self._json[0].get('Id') or 0
        return 0

class processes:
    ROBOT_LIBRARY_SCOPE = 'GLOBAL'

    def run_command(self, cmd):
        result = subprocess.run(
            cmd,
            shell=True,
            capture_output=True,
            text=True,
            encoding='utf-8',
            errors='ignore'
        )
        return result

    def db_scalar(self, query):
        cmd = ['sqlcmd', '-S', r'.\SQLEXPRESS', '-d', 'HotelManagementDB', '-E', '-f', '65001', '-h', '-1', '-W', '-Q', f'SET NOCOUNT ON; {query}']
        res = subprocess.run(cmd, capture_output=True, text=True, encoding='utf-8', errors='ignore')
        return res.stdout.strip()

    def check_has_pages(self, pages_result):
        if isinstance(pages_result, (list, tuple)) and len(pages_result) == 2:
            if pages_result[0] == 'PASS' and isinstance(pages_result[1], list):
                return len(pages_result[1]) > 0
        return False

    def get_id(self, obj, default=0):
        if not obj:
            return default
        if hasattr(obj, 'id') and not isinstance(getattr(obj, 'id'), (type(lambda: 0), type(self.get_id))):
            val = getattr(obj, 'id')
            if val is not None and not callable(val):
                return val
        if hasattr(obj, 'json'):
            try:
                obj = obj.json()
            except Exception:
                pass
        if isinstance(obj, dict):
            if 'id' in obj and obj['id'] is not None:
                return obj['id']
            if 'Id' in obj and obj['Id'] is not None:
                return obj['Id']
            data = obj.get('data')
            if isinstance(data, dict):
                return data.get('id') or data.get('Id') or default
            if isinstance(data, list) and len(data) > 0 and isinstance(data[0], dict):
                return data[0].get('id') or data[0].get('Id') or default
            return default
        if isinstance(obj, list) and len(obj) > 0 and isinstance(obj[0], dict):
            return obj[0].get('id') or obj[0].get('Id') or default
        return default

    def _prepare_payload(self, json_data, headers):
        hdrs = dict(headers) if headers else {}
        if 'Content-Type' not in hdrs:
            hdrs['Content-Type'] = 'application/json'
        if isinstance(json_data, str):
            if json_data.startswith('json='):
                json_data = json_data[5:]
            return json_data.encode('utf-8'), hdrs
        elif json_data is not None:
            return json.dumps(json_data).encode('utf-8'), hdrs
        return None, hdrs

    def raw_get(self, url, headers=None):
        try:
            r = requests.get(url, headers=headers, timeout=30)
            return ApiResponse(r)
        except Exception as e:
            class Dummy:
                status_code = 500
                text = str(e)
                def json(self): return AttrDict()
            return Dummy()

    def raw_post(self, url, json=None, headers=None, file=None):
        try:
            data, hdrs = self._prepare_payload(json, headers)
            r = requests.post(url, data=data, headers=hdrs, timeout=30)
            return ApiResponse(r)
        except Exception as e:
            class Dummy:
                status_code = 500
                text = str(e)
                def json(self): return AttrDict()
            return Dummy()

    def raw_put(self, url, json=None, headers=None):
        try:
            data, hdrs = self._prepare_payload(json, headers)
            r = requests.put(url, data=data, headers=hdrs, timeout=30)
            return ApiResponse(r)
        except Exception as e:
            class Dummy:
                status_code = 500
                text = str(e)
                def json(self): return AttrDict()
            return Dummy()

    def raw_patch(self, url, json=None, headers=None):
        try:
            data, hdrs = self._prepare_payload(json, headers)
            r = requests.patch(url, data=data, headers=hdrs, timeout=30)
            return ApiResponse(r)
        except Exception as e:
            class Dummy:
                status_code = 500
                text = str(e)
                def json(self): return AttrDict()
            return Dummy()

    def raw_delete(self, url, headers=None):
        try:
            r = requests.delete(url, headers=headers, timeout=30)
            return ApiResponse(r)
        except Exception as e:
            class Dummy:
                status_code = 500
                text = str(e)
                def json(self): return AttrDict()
            return Dummy()
