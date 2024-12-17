// import { useState } from 'react'
// import reactLogo from './assets/react.svg'
// import viteLogo from '/vite.svg'
import './App.css'

// function App() {
//   const [count, setCount] = useState(0)

//   return (
//     <>
//       <div>
//         <a href="https://vitejs.dev" target="_blank">
//           <img src={viteLogo} className="logo" alt="Vite logo" />
//         </a>
//         <a href="https://react.dev" target="_blank">
//           <img src={reactLogo} className="logo react" alt="React logo" />
//         </a>
//       </div>
//       <h1>Vite + React</h1>
//       <div className="card">
//         <button onClick={() => setCount((count) => count + 1)}>
//           count is {count}
//         </button>
//         <p>
//           Edit <code>src/App.jsx</code> and save to test HMR
//         </p>
//       </div>
//       <p className="read-the-docs">
//         Click on the Vite and React logos to learn more
//       </p>
//     </>
//   )
// }

// export default App
import React, { useState } from 'react';
import {
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  UploadOutlined,
  UserOutlined,
  VideoCameraOutlined,
  AppstoreOutlined,
  CalendarOutlined,
  LinkOutlined,
  MailOutlined,
  SettingOutlined,
} from '@ant-design/icons';
import { Button, Layout, Menu, theme } from 'antd';
import logo from '../src/assets/img/logo.png'

const { Header, Sider, Content } = Layout;

const App = () => {
  const [collapsed, setCollapsed] = useState(false);
  const {
    token: { colorBgContainer, borderRadiusLG },
  } = theme.useToken();
  return (
    <Layout style={{ minHeight: "100vh", width: "100%" }}>
      <Sider trigger={null} collapsible collapsed={collapsed}>
      
      <div
          style={{
            height: '64px',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            background: '#001529', // Mesma cor do tema "dark"
            margin: '10px'
          }}
        >
          <img src={logo} className="logo" />
        </div>
        <div className="demo-logo-vertical" />
        <Menu
          theme="dark"
          mode="inline"
          defaultSelectedKeys={['1']}
          items={[
            {
              key: '1',
              icon: <MailOutlined />,
              label: 'Navigation One',
            },
            {
              key: '2',
              icon: <CalendarOutlined />,
              label: 'Navigation Two',
            },
            {
              key: 'sub1',
              label: 'Navigation Two',
              icon: <AppstoreOutlined />,
              children: [
                {
                  key: '3',
                  label: 'Option 3',
                },
                {
                  key: '4',
                  label: 'Option 4',
                },
                {
                  key: 'sub1-2',
                  label: 'Submenu',
                  children: [
                    {
                      key: '5',
                      label: 'Option 5',
                    },
                    {
                      key: '6',
                      label: 'Option 6',
                    },
                  ],
                },
              ],
            },
            {
              key: 'sub2',
              label: 'Navigation Three',
              icon: <SettingOutlined />,
              children: [
                {
                  key: '7',
                  label: 'Option 7',
                },
                {
                  key: '8',
                  label: 'Option 8',
                },
                {
                  key: '9',
                  label: 'Option 9',
                },
                {
                  key: '10',
                  label: 'Option 10',
                },
              ],
            },
          ]}
        />
      </Sider>
      <Layout>
        <Header
          style={{
            padding: 0,
            background: colorBgContainer,
          }}
        >
          <Button
            type="text"
            icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
            onClick={() => setCollapsed(!collapsed)}
            style={{
              fontSize: '16px',
              width: 64,
              height: 64,
            }}
          />
        </Header>
        <Content
          style={{
            margin: '24px 16px',
            padding: 24,
            minHeight: 280,
            background: colorBgContainer,
            borderRadius: borderRadiusLG,
          }}
        >
          Content
        </Content>
      </Layout>
    </Layout>
  );
};
export default App;